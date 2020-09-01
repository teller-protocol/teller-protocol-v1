// JS Libraries
const withData = require('leche').withData;
const { t, DUMMY_ADDRESS } = require("../../../utils/consts");
const { uniswap } = require('../../../utils/events');
const { assert } = require('chai');
// Mock contracts
const DAI = artifacts.require("./mock/token/DAIMock.sol");
const USDC = artifacts.require("./mock/token/USDCMock.sol");
const WETH = artifacts.require("./mock/token/WETHMock.sol");
// Smart contracts

const Uniswap = artifacts.require("../mock/base/Escrow/Dapps/UniswapMock.sol");
const UniswapRouter = artifacts.require("./mock/base/Escrow/Dapps/UniswapV2Router02Mock.sol");

contract("UniswapSwapTest", function(accounts) {
  const DONT_ALTER_BALANCE = 999999;
  const SIMULATE_UNISWAP_RESPONSE_ERROR = 777777;

  let uniswapV2Router02;
  let instance;
  let dai;
  let usdc;
  let weth;

  beforeEach(async () => {
    dai = await DAI.new(); // Used as Input as well as ETH
    usdc = await USDC.new(); // Used as Input as well as ETH
    weth = await WETH.new(); // Used only as Output
    uniswapV2Router02 = await UniswapRouter.new();
    instance = await Uniswap.new();
  });

  withData({
    _1_ethForTokens: [ 0, [ 'eth', 'dai' ], 50, 50, 4, true, true, false, null ],    
    _2_wethIsNotContract: [ 0, [ 'eth' ], 0, 0, 0, true, false, true, "CANONICAL_WETH_MUST_BE_CONTRACT" ],
    _3_routerIsNotContract: [ 0, [ 'eth' ], 0, 0, 0, false, true, true, "ROUTER_MUST_BE_A_CONTRACT" ],
    _4_pathTooShort: [ 0, [ 'eth' ], 0, 0, 0, true, true, true, "UNISWAP_PATH_TOO_SHORT" ],
    _5_sourceAndDestinationSame: [ 0, [ 'dai', 'dai' ], 0, 0, 0, true, true, true, "UNISWAP_SOURCE_AND_DESTINATION_SAME" ],
    _6_minDestinationZero: [ 0, [ 'eth', 'dai' ], 0, 0, 0, true, true, true, "UNISWAP_MIN_DESTINATION_ZERO" ],
    _7_insufficientSourceEth: [ 0, [ 'eth', 'usdc' ], 50, 0, 1, true, true, true, "UNISWAP_INSUFFICIENT_ETH" ],
    _8_insufficientSourceToken: [ 0, [ 'dai', 'usdc' ], 50, 0, 1, true, true, true, "UNISWAP_INSUFFICIENT_TOKENS" ],
    _9_ethForTokensUniswapError: [ 0, [ 'eth', 'dai' ], 50, 50, SIMULATE_UNISWAP_RESPONSE_ERROR, true, true, true, "UNISWAP_ERROR_SWAPPING" ],
    _10_ethForTokensBalanceError: [ 0, [ 'eth', 'dai' ], 50, 50, DONT_ALTER_BALANCE, true, true, true, "UNISWAP_BALANCE_NOT_INCREASED" ],
  }, function(
    senderAccount,
    path,
    sourceAmount,
    sourceBalance,
    minDestination,
    routerIsContract,
    wethIsContract,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("uniswap", "swapExactETHForTokens", "Should be able (or not) to swap tokens on Uniswap", mustFail), async function() {
      // Setup
      if (sourceBalance > 0) {
        if (path[0] === 'eth') {
          await web3.eth.sendTransaction({ to: instance.address, from: accounts[0], value: sourceBalance + 1 })
        } else if (path[0] === 'dai') {
          await dai.mint(instance.address, sourceBalance);
        } else if (path[0] === 'usdc') {  
          await usdc.mint(instance.address, sourceBalance);
        }
      }
      const sender = accounts[senderAccount];
      path = path.map((name) => name === 'eth' ? weth.address : name === 'dai' ? dai.address : usdc.address);
      !routerIsContract ? uniswapV2Router02.address = DUMMY_ADDRESS : null;
      !wethIsContract ? weth.address = DUMMY_ADDRESS : null;
      try {

        // Invocation using Mock as proxy to access internal functions
        const result = await instance.swap(weth.address, uniswapV2Router02.address, path, sourceAmount , minDestination, {from: sender});
        assert(!mustFail, 'It should have failed because data is invalid.');

        // State updates are validated inside the dApp contract and events emitted

        // Validating state updates and events
        uniswap
          .uniswapSwapped(result)
          .emitted(
            sender, 
            instance.address, 
            path[0],
            path[ path.length - 1 ],
            sourceAmount, 
            minDestination
          );
      } catch (error) {
        assert(mustFail);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });



  withData({
     _1_tokenDaiForEth: [ [ 'dai', 'weth' ], 50, 50, 1, false, null ],
     _2_tokenUsdcForEth: [ [ 'usdc', 'weth' ], 50, 50,  1, false, null ],
     _3_tokensUsdcForEth: [ [ 'usdc', 'weth' ], 50, 50, SIMULATE_UNISWAP_RESPONSE_ERROR, true, "UNISWAP_ERROR_SWAPPING" ],
     _4_tokensUsdcForEth: [ [ 'usdc', 'weth' ], 50, 50, DONT_ALTER_BALANCE, true, "UNISWAP_BALANCE_NOT_INCREASED" ],
     _5_insuficientTokensForEth: [ [ 'usdc', 'weth' ], 50, 0, 1, true, "UNISWAP_INSUFFICIENT_TOKENS" ]
  }, function(
     path,
     sourceAmount,
     sourceBalance,
     minDestination,
     mustFail,
     expectedErrorMessage
   ) {
     it(t("uniswap", "swapExactTokensForETH", "Should be able to swap tokens for ETH on Uniswap", mustFail), async function() {
      // Setup
      const sender = accounts[0];
      // Minting origin on dApp
      await path[0] === 'dai'
        ? dai.mint(instance.address, sourceBalance)
        : usdc.mint(instance.address, sourceBalance)
      path = path.map( (name) => 
           name === 'eth' ? weth.address 
         : name === 'dai' ? dai.address 
         : name === 'usdc' ? usdc.address 
         : weth.address
      );
       try {
         // Invocation using Mock as proxy for internal functions
         const result = await instance.swap(weth.address, uniswapV2Router02.address, path, sourceAmount, minDestination, { from: sender });
         assert(!mustFail, 'It should have failed because data is invalid.');
 
         // Validating state updates and events
         uniswap
          .uniswapSwapped(result)
          .emitted(
            sender, 
            instance.address, 
            path[0],
            path[ path.length - 1 ],
            sourceAmount, 
            minDestination
          );
       } catch (error) {
         assert(mustFail);
         assert(error);
         assert.equal(error.reason, expectedErrorMessage);
       }
     });
   });

  
   withData({
    _1_tokensDaiForTokensUsdc: [ [ 'dai', 'usdc' ], 50, 50, 1, false, null ],
    _2_tokensUsdcForTokensDai: [ [ 'usdc', 'dai' ], 50, 50, 1, false, null ],
    _3_tokensUsdcForTokensDai: [ [ 'usdc', 'dai' ], 50, 50, SIMULATE_UNISWAP_RESPONSE_ERROR, true, "UNISWAP_ERROR_SWAPPING" ],
    _4_tokensUsdcForDaiBalanceError: [ [ 'usdc', 'dai' ], 50, 50, DONT_ALTER_BALANCE, true, "UNISWAP_BALANCE_NOT_INCREASED" ],
    _5_insufficientTokensForTokens: [ [ 'usdc', 'dai' ], 50, 0, 1, true, "UNISWAP_INSUFFICIENT_TOKENS" ]
  }, function(
    path,
    sourceAmount,
    sourceBalance,
    minDestination,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("uniswap", "swap", "Should be able to swap tokens for tokens on Uniswap", mustFail), async function() {
      // Setup
      const sender = accounts[0];
      await path[0] === 'dai'
        ? dai.mint(instance.address, sourceBalance)
        : usdc.mint(instance.address, sourceBalance)
      path = path.map((name) => name === 'dai' ? dai.address : usdc.address)
      try {
        // Invocation using Mock as proxy for internal functions
        const result = await instance.swap(weth.address, uniswapV2Router02.address, path, sourceAmount, minDestination, {from: sender});
        assert(!mustFail, 'It should have failed because data is invalid.');

        // Validating state updates and events
        uniswap
          .uniswapSwapped(result)
          .emitted(
            sender, 
            instance.address, 
            path[0],
            path[ path.length -1 ],
            sourceAmount, 
            minDestination
          );

      } catch (error) {
        assert(mustFail);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });



});
