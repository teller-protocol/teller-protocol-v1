// JS Libraries
const withData = require("leche").withData;
const { t } = require("../../../utils/consts");
const { uniswap } = require("../../../utils/events");
const { assert } = require("chai");
// Mock contracts
const DAI = artifacts.require("./mock/token/DAIMock.sol");
const USDC = artifacts.require("./mock/token/USDCMock.sol");
const WETH = artifacts.require("./mock/token/WETHMock.sol");
// Smart contracts

const Uniswap = artifacts.require("./mock/base/escrow/dapps/UniswapMock.sol");

contract("UniswapSwapTest", function(accounts) {
  const owner = accounts[0];

  const DONT_ALTER_BALANCE = 999999;
  const SIMULATE_UNISWAP_RESPONSE_ERROR = 777777;

  let instance;
  let dai;
  let usdc;
  let weth;

  beforeEach(async () => {
    dai = await DAI.new();
    usdc = await USDC.new();
    weth = await WETH.new();
    instance = await Uniswap.new(weth.address, { from: owner });
  });

  withData({
    _1_dai_for_usdc: [ 0, [ "dai", "usdc" ], 50, 50, 1, false, null ],
    _2_usdc_for_dai: [ 0, [ "usdc", "dai" ], 50, 50, 1, false, null ],
    _3_weth_for_dai: [ 0, [ "weth", "dai" ], 50, 50, 1, false, null ],
    _4_path_too_short: [ 0, [ "dai" ], 0, 0, 0, true, "UNISWAP_PATH_TOO_SHORT" ],
    _5_source_and_destination_same: [ 0, [ "dai", "dai" ], 0, 0, 0, true, "UNISWAP_SOURCE_AND_DESTINATION_SAME" ],
    _6_min_destination_zero: [ 0, [ "usdc", "dai" ], 0, 0, 0, true, "UNISWAP_MIN_DESTINATION_ZERO" ],
    _7_insufficient_source: [ 0, [ "dai", "usdc" ], 50, 0, 1, true, "UNISWAP_INSUFFICIENT_SOURCE" ],
    _8_swapping_error: [ 0, [ "usdc", "dai" ], 50, 50, SIMULATE_UNISWAP_RESPONSE_ERROR, true, "UNISWAP_ERROR_SWAPPING" ],
    _9_balance_error: [ 0, [ "usdc", "dai" ], 50, 50, DONT_ALTER_BALANCE, true, "UNISWAP_BALANCE_NOT_INCREASED" ]
  }, function(
    senderAccount,
    path,
    sourceAmount,
    sourceBalance,
    minDestination,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("uniswap", "swap", "Should be able (or not) to swap tokens on Uniswap", mustFail), async function() {
      // Setup
      if (sourceBalance > 0) {
        if (path[0] === "weth") {
          await weth.mint(instance.address, sourceBalance);
        } else if (path[0] === "dai") {
          await dai.mint(instance.address, sourceBalance);
        } else if (path[0] === "usdc") {
          await usdc.mint(instance.address, sourceBalance);
        }
      }
      const sender = accounts[senderAccount];
      path = path.map((name) => name === "weth" ? weth.address : name === "dai" ? dai.address : usdc.address);

      try {
        // Invocation using Mock as proxy to access internal functions
        const result = await instance.swap(path, sourceAmount, minDestination, { from: sender });
        assert(!mustFail, "It should have failed because data is invalid.");

        // State updates are validated inside the dApp contract and events emitted

        // Validating state updates and events
        uniswap
          .uniswapSwapped(result)
          .emitted(
            sender,
            instance.address,
            path[0],
            path[path.length - 1],
            sourceAmount,
          );
      } catch (error) {
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
