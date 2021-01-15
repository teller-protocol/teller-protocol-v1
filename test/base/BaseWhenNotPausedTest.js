// JS Libraries
const withData = require('leche').withData;
const { createTestSettingsInstance } = require('../utils/settings-helper');
const { t } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');
const BaseMock = artifacts.require('./mock/base/BaseMock.sol');

// Smart contracts
const Settings = artifacts.require('./base/Settings.sol');

contract('BaseWhenNotPausedTest', function (accounts) {
  const owner = accounts[0];
  let settings;
  let instance;

  beforeEach('Setup for each test', async () => {
    settings = await createTestSettingsInstance(Settings, { from: owner, Mock });
    instance = await BaseMock.new();
    await instance.externalInitialize(settings.address);
  });

  withData(
    {
      _1_notPaused: [false, undefined, false],
      _2_paused: [true, 'PLATFORM_IS_PAUSED', true],
    },
    function (callPause, expectedErrorMessage, mustFail) {
      it(
        t(
          'user',
          'whenNotPaused',
          'Should (or not) be able to call function when it is/isnt paused.',
          mustFail
        ),
        async function () {
          // Setup
          if (callPause) {
            await settings.pause({ from: owner });
          }

          try {
            // Invocation
            const result = await instance.externalWhenNotPaused();

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

  withData(
    {
      _1_notPaused: [2, false, undefined, false],
      _2_paused: [2, true, 'LENDING_POOL_IS_PAUSED', true],
    },
    function (senderIndex, callPause, expectedErrorMessage, mustFail) {
      it(
        t(
          'user',
          'whenLendingPoolNotPaused',
          'Should (or not) be able to call function when a lending address is/isnt paused.',
          mustFail
        ),
        async function () {
          // Setup
          const senderAddress = accounts[senderIndex];
          if (callPause) {
            await settings.pauseLendingPool(instance.address, { from: owner });
          }

          try {
            // Invocation
            const result = await instance.externalWhenLendingPoolNotPaused(
              instance.address,
              { from: senderAddress }
            );

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
