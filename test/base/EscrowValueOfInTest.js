// JS Libraries
const { withData } = require("leche");
const { t, ETH_ADDRESS,  } = require("../utils/consts");
const { createTestSettingsInstance } = require('../utils/settings-helper');
const ChainlinkAggregatorEncoder = require("../utils/encoders/ChainlinkAggregatorEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const CERC20Mock = artifacts.require("./mock/providers/compound/CERC20Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");

contract("EscrowValueOfInTest", function(accounts) {
  const chainlinkAggregatorEncoder = new ChainlinkAggregatorEncoder(web3)

  let instance;
  let aggregator;
  let settingsInstance;
  let CDAIInstance;
  let CETHInstance;

  before(async () => {
    settingsInstance = await createTestSettingsInstance(Settings, {
      Mock,
      initialize: true,
      onInitialize: (_, { chainlinkAggregator }) => {
        aggregator = chainlinkAggregator
      }
    });

    CETHInstance = await CERC20Mock.new("CETH", "CETH", 18, ETH_ADDRESS, 460);

    instance = await Escrow.new();
    await instance.mockSettings(settingsInstance.address);
  });

  withData({
    '_1_success': [ '1234500000000000', false, null ],
  }, function(
    expectedValue,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "_valueOfIn", "Should be able to calculate the value of a base asset in a quote asset.", mustFail), async function() {
      // Setup
      await aggregator.givenMethodReturnUint(chainlinkAggregatorEncoder.encodeValueFor(), expectedValue)
      await CETHInstance.mint(instance.address, 100);

      try {
        // Invocation
        const value = await instance.externalValueOfIn.call(CETHInstance.address, ETH_ADDRESS, 4);
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
