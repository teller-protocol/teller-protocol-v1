// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');

// Smart contracts
const Base = artifacts.require('./mock/base/BaseMock.sol');

contract('BaseInitializeTest', function (accounts) {
  withData(
    {
      _1_valid: [99, undefined, false],
      _2_settings_empty: [-1, 'SETTINGS_MUST_BE_PROVIDED', true],
      _3_settings_not_contract: [1, 'SETTINGS_MUST_BE_A_CONTRACT', true],
    },
    function (settingsIndex, expectedErrorMessage, mustFail) {
      it(
        t(
          'user',
          'initialize',
          'Should (or not) be able to initialize the new instance.',
          mustFail
        ),
        async function () {
          // Setup
          const settingsInstance = await Mock.new();
          const settingsAddress =
            settingsIndex === -1
              ? NULL_ADDRESS
              : settingsIndex === 99
              ? settingsInstance.address
              : accounts[settingsIndex];
          const instance = await Base.new();

          try {
            // Invocation
            const result = await instance.externalInitialize(settingsAddress);

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
