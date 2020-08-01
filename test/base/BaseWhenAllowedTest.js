// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Mock contracts
const BaseMock = artifacts.require("./mock/base/BaseMock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('BaseWhenAllowedTest', function (accounts) {
    const owner = accounts[0];
    let settings;
    let instance;

    beforeEach('Setup for each test', async () => {
        settings = await Settings.new(1, 1, 1, 1, 1, 1, 1);
        instance = await BaseMock.new();
        await instance.externalInitialize(settings.address);
    });

    withData({
        _1_notAllowed: [1, false, 'ADDRESS_ISNT_ALLOWED', true],
        _2_allowed: [2, true, undefined, false],
    }, function(addressIndex, callAddPauser, expectedErrorMessage, mustFail) {
        it(t('user', 'externalWhenAllowed', 'Should (or not) be able to call function when it is/isnt allowed.', mustFail), async function() {
            // Setup
            const address = accounts[addressIndex];
            if (callAddPauser) {
                await settings.addPauser(address, { from: owner });
            }

            try {
                // Invocation
                const result = await instance.externalWhenAllowed(address);

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
}); 