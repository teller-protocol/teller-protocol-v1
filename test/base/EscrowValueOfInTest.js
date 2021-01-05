// JS Libraries
const { withData } = require("leche");
const { t, ETH_ADDRESS,  } = require("../utils/consts");
const { createTestSettingsInstance } = require('../utils/settings-helper');
const ChainlinkAggregatorEncoder = require("../utils/encoders/ChainlinkAggregatorEncoder");
const CompoundInterfaceEncoder = require("../utils/encoders/CompoundInterfaceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const CERC20Mock = artifacts.require("./mock/providers/compound/CERC20Mock.sol");
const DAI = artifacts.require('DAIMock.sol');

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");

contract("EscrowValueOfInTest", function(accounts) {
  const chainlinkAggregatorEncoder = new ChainlinkAggregatorEncoder(web3)
  const cTokenEncoder = new CompoundInterfaceEncoder(web3)

  let instance;
  let aggregator;
  let settingsInstance;
  let daiInstance;
  let CDAIInstance;
  let CETHInstance;

  before(async () => {
    settingsInstance = await createTestSettingsInstance(Settings, {
      Mock,
      initialize: true,
      onInitialize: (_, { chainlinkAggregator, ceth }) => {
        aggregator = chainlinkAggregator
        CETHInstance = ceth
      }
    });

    daiInstance = await DAI.new()
    CDAIInstance = await Mock.new()
    await CDAIInstance.givenMethodReturnUint(
      cTokenEncoder.encodeDecimals(),
      '18'
    )
    await CDAIInstance.givenMethodReturnAddress(
      cTokenEncoder.encodeRedeemUnderlying(),
      CDAIInstance.address
    )

    instance = await Escrow.new();
    await instance.mockSettings(settingsInstance.address);
  });

  withData({
    _1_no_exchange_rate: {
      isCToken: false,
      expectedValue: '1234500000000000',
      mustFail: false,
      expectedErrorMessage: null
    },
    _1_success: {
      isCToken: false,
      expectedValue: '1234500000000000',
      mustFail: false,
      expectedErrorMessage: null
    },
  }, function({
    isCToken,
    expectedValue,
    mustFail,
    expectedErrorMessage
  }) {
    it(t("escrow", "_valueOfIn", "Should be able to calculate the value of a base asset in a quote asset.", mustFail), async function() {
      // Setup
      await aggregator.givenMethodReturnUint(chainlinkAggregatorEncoder.encodeValueFor(), expectedValue)

      let baseToken = daiInstance
      if (isCToken) {
        baseToken = CDAIInstance
        await CDAIInstance.givenMethodReturnUint(
          cTokenEncoder.encodeExchangeRateStored(),
          '1234567890'
        )
      }

      try {
        // Invocation
        const value = await instance.externalValueOfIn.call(baseToken.address, ETH_ADDRESS, '1');
        // Assertions
        assert.equal(value.toString(), expectedValue.toString(), 'Values do not match')
      } catch (error) {
        assert(mustFail, error.message);
        assert.equal(error.message, expectedErrorMessage);
      }
    });
  });
});
