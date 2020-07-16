// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Base = artifacts.require("./mock/base/BaseMock.sol");

contract('BaseInitializeTest', function (accounts) {

    withData({
        _1_basic: [false, undefined, false],
        _2_notSettings: [true, 'SETTINGS_MUST_BE_PROVIDED', true],
    }, function(emptySettingsAddress, expectedErrorMessage, mustFail) {
        it(t('user', 'initialize', 'Should (or not) be able to initialize the new instance.', mustFail), async function() {
            // Setup
            const settingsInstance = await Mock.new();
            const settingsAddress = emptySettingsAddress ? NULL_ADDRESS : settingsInstance.address;
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
        });
    });
});