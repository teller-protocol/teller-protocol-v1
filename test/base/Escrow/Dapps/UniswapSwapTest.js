// JS Libraries
const withData = require('leche').withData;
const { t, ETH_ADDRESS } = require("../../../utils/consts");
const UniswapEncoder = require("../../../utils/encoders/UniswapEncoder");
const { uniswap } = require('../../../utils/events');
const { assert } = require('chai');
// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");
const USDC = artifacts.require("./mock/token/USDCMock.sol");
// Smart contracts

const Uniswap = artifacts.require("./mock/base/Escrow/Dapps/UniswapMock.sol");

contract("UniswapSwapTest", function(accounts) {
  const uniswapEncoder = new UniswapEncoder(web3);
  const RECEIVED_AMOUNT = 5;

  let uniswapV2Router02;
  let instance;
  let dai;
  let usdc;

  beforeEach(async () => {
    uniswapV2Router02 = await Mock.new();
    instance = await Uniswap.new();
    // Overriding proxy's response in case of a change during previous executions
    const result = await web3.eth.abi.encodeParameter("uint[]", [1,RECEIVED_AMOUNT]);
    await uniswapV2Router02.givenAnyReturn(result);
    dai = await DAI.new();
    usdc = await USDC.new();
  });

  withData({
    _1_pathTooShort: [ 0, [ 'eth' ], 0, 0, 0, false, true, "UNISWAP_PATH_TOO_SHORT" ],
    _2_sourceAndDestinationSame: [ 0, [ 'dai', 'dai' ], 0, 0, 0, false, true, "UNISWAP_SOURCE_AND_DESTINATION_SAME" ],
    _3_minDestinationZero: [ 0, [ 'eth', 'dai' ], 0, 0, 0, false, true, "UNISWAP_MIN_DESTINATION_ZERO" ],
    _4_insufficientSourceEth: [ 0, [ 'eth', 'usdc' ], 50, 0, 1, false, true, "UNISWAP_INSUFFICIENT_ETH" ],
    _5_insufficientSourceToken: [ 0, [ 'dai', 'usdc' ], 50, 0, 1, false, true, "UNISWAP_INSUFFICIENT_TOKENS" ],
    _6_ethForTokensUniswapError: [ 0, [ 'eth', 'dai' ], 50, 50, 1, true, true, "UNISWAP_ERROR_SWAPPING" ],
    _7_ethForTokens: [ 0, [ 'eth', 'dai' ], 50, 50, 1, false, false, null ],
  }, function(
    senderAccount,
    path,
    sourceAmount,
    sourceBalance,
    minDestination,
    uniswapReturnError,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("uniswap", "swap", "Should be able (or not) to swap tokens on Uniswap", mustFail), async function() {
      // Setup
      if (sourceBalance > 0) {
        if (path[0] === 'eth') {
          await web3.eth.sendTransaction({ to: instance.address, from: accounts[0], value: sourceBalance + 1 })
        } else {
          await path[0] === 'dai'
            ? dai.mint(instance.address, sourceAmount)
            : usdc.mint(instance.address, sourceAmount)
        }
      }
      const sender = accounts[senderAccount];
      path = path.map((name) => name === 'eth' ? ETH_ADDRESS : name === 'dai' ? dai.address : usdc.address);
      // To simulate Uniswap swap() return error
      if (uniswapReturnError) {
        const pathTooLong = await web3.eth.abi.encodeParameter("uint[]", [1,2,3,4,RECEIVED_AMOUNT]);
        await uniswapV2Router02.givenAnyReturn(pathTooLong);
      }
      try {
        // Invocation using Mock as proxy to access internal functions
        const result = await instance.callSwap(uniswapV2Router02.address, path, sourceAmount, minDestination, {from: sender});
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
            RECEIVED_AMOUNT
          );
      } catch (error) {
        assert(mustFail);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });



  withData({
     _1_tokenDaiForEth: [ [ 'dai', 'eth' ], 50, 50, 1, false, false, null ],
     _2_tokenUsdcForEth: [ [ 'usdc', 'eth' ], 50, 50,  1, false, false, null ],
     _3_tokensUsdcForEth: [ [ 'usdc', 'eth' ], 50, 50, 1, true, true, "UNISWAP_ERROR_SWAPPING" ],
     _4_insuficientTokensForEth: [ [ 'usdc', 'eth' ], 50, 0, 1, false, true, "UNISWAP_INSUFFICIENT_TOKENS" ]
   }, function(
     path,
     sourceAmount,
     sourceBalance,
     minDestination,
     uniswapNoResult,
     mustFail,
     expectedErrorMessage
   ) {
     it(t("uniswap", "swap", "Should be able to swap tokens for ETH on Uniswap", mustFail), async function() {
      // Setup
      const sender = accounts[0];
      await path[0] === 'dai'
        ? dai.mint(instance.address, sourceBalance)
        : usdc.mint(instance.address, sourceBalance)
       path = path.map((name) => name === 'eth' ? ETH_ADDRESS : name === 'dai' ? dai.address : usdc.address)
        // Configuring no results from Uniswap
      if (uniswapNoResult) {
        const noResult = await web3.eth.abi.encodeParameter("uint[]", []);
        await uniswapV2Router02.givenAnyReturn(noResult);
      }
       try {
 
         // Invocation using Mock as proxy for internal functions
         const result = await instance.callSwap(uniswapV2Router02.address, path, sourceAmount, minDestination, { from: sender });
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
            RECEIVED_AMOUNT
          );
       } catch (error) {
         assert(mustFail);
         assert(error);
         assert.equal(error.reason, expectedErrorMessage);
       }
     });
   });

   withData({
    _1_tokensDaiForTokensUsdc: [ [ 'dai', 'usdc' ], 50, 50, 1, false, false, null ],
    _2_tokensUsdcForTokensDai: [ [ 'usdc', 'dai' ], 50, 50, 1, false, false, null ],
    _3_tokensUsdcForTokensDai: [ [ 'usdc', 'dai' ], 50, 50, 1, true, true, "UNISWAP_ERROR_SWAPPING" ],
    _4_insufficientTokensForTokens: [ [ 'usdc', 'dai' ], 50, 0, 1, false, true, "UNISWAP_INSUFFICIENT_TOKENS" ]
  }, function(
    path,
    sourceAmount,
    sourceBalance,
    minDestination,
    uniswapNoResult,
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
      // Configuring no results from Uniswap
      if (uniswapNoResult) {
        const noResult = await web3.eth.abi.encodeParameter("uint[]", []);
        await uniswapV2Router02.givenAnyReturn(
          noResult
        );
      }
      try {        
        // Invocation using Mock as proxy for internal functions
        const result = await instance.callSwap(uniswapV2Router02.address, path, sourceAmount, minDestination, {from: sender});
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
            RECEIVED_AMOUNT
          );

      } catch (error) {
        assert(mustFail);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });


});
