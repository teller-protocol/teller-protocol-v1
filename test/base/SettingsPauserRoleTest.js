// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { createTestSettingsInstance } = require('../utils/settings-helper');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsPauserRoleTest', function (accounts) {
    const ownerIndex = 0;
    const owner = accounts[ownerIndex];
    let instance;

    beforeEach('Setup for each test', async () => {
        instance = await createTestSettingsInstance(Settings, { from: owner, Mock });
    });

    withData({
        _1_is_owner: [ownerIndex, false, true, null, false],
        _2_allowed: [2, true, true, undefined, false],
        _3_not_allowed: [1, false, false, 'NOT_PAUSER', true],
    }, function(addressIndex, callAddPauser, expectedResponse, expectedErrorMessage, mustFail) {
        it(t('user', 'hasPauserRole', 'Should (or not) have the Pauser role.', mustFail), async function() {
            // Setup
            const address = accounts[addressIndex];
            if (callAddPauser) {
              try {
                    await instance.addPauser(address);
              } catch (err) {
                  console.error(err)
              }
            }

            try {
                // Invocation
                const hasPauserRole = await instance.hasPauserRole.call(address);

                // Assertions
                assert.equal(hasPauserRole, expectedResponse, 'Pauser role not correct.')
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_is_owner: [ownerIndex, false, null, false],
        _2_allowed: [2, true, undefined, false],
        _3_not_allowed: [1, false, 'NOT_PAUSER', true],
    }, function(addressIndex, callAddPauser, expectedErrorMessage, mustFail) {
        it(t('user', 'requirePauserRole', 'Should revert if address does not have the Pauser role.', mustFail), async function() {
            // Setup
            const address = accounts[addressIndex];
            if (callAddPauser) {
                await instance.addPauser(address, { from: owner });
            }

            try {
                // Invocation
                await instance.requirePauserRole.call(address);

                // Assertions
                assert(!mustFail, 'Should have thrown due to not having Pauser role.')
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
}); 