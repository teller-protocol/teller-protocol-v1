// JS Libraries
const withData = require('leche').withData;
const { t, createMocks, NULL_ADDRESS } = require('../utils/consts');
const { assert } = require('chai');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');
const BaseUpgradeableMock = artifacts.require('./mock/base/BaseUpgradeableMock.sol');

// Smart contracts

contract('BaseUpgradeableTest', function (accounts) {
  let instance;
  let mocks;

  beforeEach('Setup for each test', async () => {
    mocks = await createMocks(Mock, 10);
    instance = await BaseUpgradeableMock.new();
  });

  const getInstance = (refs, index, accountIndex) =>
    index === -1 ? NULL_ADDRESS : index === 99 ? accounts[accountIndex] : refs[index];

  withData(
    {
      _1_valid: [0, 0, undefined, false],
      _2_not_prveious_not_contract: [0, 99, 'SETTINGS_MUST_BE_A_CONTRACT', true],
      _3_not_previous_empty: [0, -1, 'SETTINGS_MUST_BE_A_CONTRACT', true],
      _4_previous_and_empty_not_change_settings: [2, -1, undefined, false],
      _5_previous_and_not_contract_not_change_settings: [2, 3, undefined, false],
    },
    function (previousSettingsIndex, settingsIndex, expectedErrorMessage, mustFail) {
      it(
        t(
          'user',
          'setSettings',
          'Should (or not) be able to set the settings.',
          mustFail
        ),
        async function () {
          // Setup
          const previousSettingsAddress = getInstance(mocks, previousSettingsIndex, 2);
          if (previousSettingsIndex > 0) {
            await instance.externalSetSettings(previousSettingsAddress);
          }
          const settingsAddress = getInstance(mocks, settingsIndex, 2);

          try {
            // Invocation
            const result = await instance.externalSetSettings(settingsAddress);

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);

            const newSettings = await instance.settings();
            if (previousSettingsIndex > 0) {
              assert.equal(newSettings, previousSettingsAddress);
            } else {
              assert.equal(newSettings, settingsAddress);
            }
          } catch (error) {
            // Assertions
            assert(mustFail, error.message);
            assert.equal(error.reason, expectedErrorMessage, error.message);
          }
        }
      );
    }
  );
});
