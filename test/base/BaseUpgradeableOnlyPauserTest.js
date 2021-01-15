// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');
const { assert } = require('chai');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');
const BaseUpgradeableMock = artifacts.require('./mock/base/BaseUpgradeableMock.sol');

// Smart contracts

contract('BaseUpgradeableOnlyPauserTest', function (accounts) {
  const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
  let instance;
  let settings;

  beforeEach('Setup for each test', async () => {
    settings = await Mock.new();
    instance = await BaseUpgradeableMock.new();
    await instance.externalSetSettings(settings.address);
  });

  withData(
    {
      _1_valid: [true, undefined, false],
      _2_not_pauser: [false, 'NOT_PAUSER', true],
    },
    function (senderHasPauserRole, expectedErrorMessage, mustFail) {
      it(
        t(
          'user',
          'onlyPauser',
          'Should (or not) be able to pass the onlyPauser modifier.',
          mustFail
        ),
        async function () {
          // Setup
          const sender = accounts[0];
          if (!senderHasPauserRole) {
            await settings.givenMethodRevertWithMessage(
              settingsInterfaceEncoder.encodeRequirePauserRole(),
              'NOT_PAUSER'
            );
          }

          try {
            // Invocation
            const result = await instance.externalOnlyPauser({ from: sender });

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
          } catch (error) {
            // Assertions
            assert(mustFail);
            assert(error);
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );
});
