// JS Libraries
const { withData } = require("leche");
const abi = require("ethereumjs-abi");
const { t, NULL_ADDRESS, toBytes32 } = require("../../../utils/consts");
const UniswapEncoder = require("../../../utils/encoders/UniswapEncoder");
const { dapps } = require('../../../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");
const USDC = artifacts.require("./mock/token/USDCMock.sol");

// Smart contracts
const Uniswap = artifacts.require("./mock/base/Escrow/Dapps/UniswapMock.sol");

contract("UniswapSwapTest", function(accounts) {
  const uniswapEncorder = new UniswapEncoder(web3);

  let uniswapV2Router02;
  let uniswap;
  let dai;
  let usdc;

  before(async () => {
    uniswapV2Router02 = await Mock.new();
    await uniswapV2Router02.givenMethodReturn(
      uniswapEncorder.encodeRouterTokensForTokens(),
      abi.rawEncode([ "uint256" ], [ 1 ])
    );
    await uniswapV2Router02.givenMethodReturn(
      uniswapEncorder.encodeRouterTokensForETH(),
      abi.rawEncode([ "uint256" ], [ 1 ])
    );
    await uniswapV2Router02.givenMethodReturn(
      uniswapEncorder.encodeRouterETHForTokens(),
      abi.rawEncode([ "uint256" ], [ 1 ])
    );

    uniswap = await Uniswap.new(uniswapV2Router02.address);

    dai = await DAI.new();
    usdc = await USDC.new();
  });

  beforeEach(async () => {
  });

  withData({
    _1_path_too_short: [ [ 'eth' ], 0, 0, 0, true, "UNISWAP_PATH_TOO_SHORT" ],
    _2_source_and_destination_same: [ [ 'dai', 'dai' ], 0, 0, 0, true, "UNISWAP_SOURCE_AND_DESTINATION_SAME" ],
    _3_min_destination_zero: [ [ 'eth', 'dai' ], 0, 0, 0, true, "UNISWAP_MIN_DESTINATION_ZERO" ],
    _4_insufficient_source_eth: [ [ 'eth', 'usdc' ], 100, 0, 1, true, "UNISWAP_INSUFFICIENT_SOURCE" ],
    _5_insufficient_source_token: [ [ 'dai', 'usdc' ], 100, 0, 1, true, "UNISWAP_INSUFFICIENT_SOURCE" ],
    _6_eth_for_tokens: [ [ 'eth', 'dai' ], 100, 100, 1, false, null ],
    _7_tokens_for_eth: [ [ 'dai', 'eth' ], 100, 100, 1, false, null ],
    _8_tokens_for_tokens: [ [ 'dai', 'usdc' ], 100, 100, 1, false, null ]
  }, function(
    path,
    sourceAmount,
    sourceBalance,
    minDestination,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "swap", "Should be able (or not) to swap tokens on Uniswap", mustFail), async function() {
      try {
        if (sourceBalance > 0) {
          if (path[0] === 'eth') {
            await web3.eth.sendTransaction({ to: uniswap.address, from: accounts[0], value: sourceBalance })
          } else {
            await path[0] === 'dai'
              ? dai.mint(uniswap.address, sourceAmount)
              : usdc.mint(uniswap.address, sourceAmount)
          }
        }
        path = path.map((name) => name === 'eth' ? NULL_ADDRESS : name === 'dai' ? dai.address : usdc.address)

        const result = await uniswap.callSwap(path, sourceAmount, minDestination);
        dapps
          .action(result)
          .emitted(toBytes32(web3, 'Uniswap'), toBytes32(web3, 'swap'))

        assert(!mustFail);
      } catch (error) {
        assert(mustFail);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
