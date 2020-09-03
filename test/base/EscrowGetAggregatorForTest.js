// JS Libraries
const { withData } = require("leche");
const { t } = require("../utils/consts");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");
const Settings = artifacts.require("./mock/base/SettingsMock.sol");
const PairAggregatorRegistry = artifacts.require("./mock/providers/chainlink/PairAggregatorRegistryMock.sol");

contract("EscrowGetAggregatorForTest", function(accounts) {
  let instance
  let registry
  let aggregator
  let base
  let quote

  beforeEach(async () => {
    const settings = await Settings.new()
    registry = await PairAggregatorRegistry.new()
    aggregator = await Mock.new()
    base = await Mock.new()
    quote = await Mock.new()

    await settings.externalSetPairAggregatorRegistry(registry.address)

    instance = await Escrow.new()
    await instance.externalSetSettings(settings.address)
  });

  withData({
    _1_basic: [ true, false, null ],
    _2_not_have_aggregator: [ false, true, "CHAINLINK_PAIR_AGGREGATOR_NOT_EXISTS" ],
  }, function test(
    hasAggregator,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "calculateTotalValue", "Should be able to calculate its total value of all assets owned.", mustFail), async function() {
      // Setup
      if (hasAggregator) {
        await registry.externalAddAggregatorFor(base.address, quote.address, aggregator.address)
      }

      let result
      try {
        // Invocation
        result = await instance.externalGetAggregatorFor.call(base.address, quote.address)
      } catch (error) {
        assert.include(error.message, expectedErrorMessage);
        assert(mustFail);
        return
      }

      // Assertions
      assert.equal(result.toString(), aggregator.address, 'Aggregator address does not match.')
    });
  });
});
