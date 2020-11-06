// JS Libraries
const { withData } = require("leche");
const { t, ETH_ADDRESS,  } = require("../utils/consts");
const { createTestSettingsInstance } = require('../utils/settings-helper');
const ChainlinkAggregatorEncoder = require("../utils/encoders/ChainlinkAggregatorEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");

contract("EscrowValueOfInTest", function(accounts) {
  const chainlinkAggregatorEncoder = new ChainlinkAggregatorEncoder(web3)

  let instance;
  let aggregator;
  let settingsInstance;

  before(async () => {
    settingsInstance = await createTestSettingsInstance(Settings, {
      Mock,
      initialize: true,
      onInitialize: (_, { chainlinkAggregator }) => {
        aggregator = chainlinkAggregator
      }
    });

    instance = await Escrow.new();
    await instance.mockSettings(settingsInstance.address);
  });

  withData({
    '_1_success': [ '123456789000000000000', false, null ],
  }, function(
    expectedValue,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "_valueOfIn", "Should be able to calculate the value of a base asset in a quote asset.", mustFail), async function() {
      // Setup
      await aggregator.givenMethodReturnUint(chainlinkAggregatorEncoder.encodeValueFor(), expectedValue)

      try {
        // Invocation
        const value = await instance.externalValueOfIn.call(ETH_ADDRESS, ETH_ADDRESS, '1');
        console.log({value});
        // Assertions
        assert.equal(value.toString(), expectedValue.toString(), 'Values do not match')
      } catch (error) {
        console.log({error});
        assert(mustFail, error.message);
        assert.equal(error.message, expectedErrorMessage);
      }
    });
  });
});
