// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");

contract('ATMSettingsInitializeTest', function (accounts) {
    let mocks;
    
    beforeEach('Setup for each test', async () => {
        mocks = await createMocks(Mock, 10);
    });

    withData({
        _1_basic: [4, undefined, false],
        _2_empty_settings: [-1, 'SETTINGS_MUST_BE_A_CONTRACT', true],
        _3_not_contract_settings: [99, 'SETTINGS_MUST_BE_A_CONTRACT', true],
    }, function(settingsIndex, expectedErrorMessage, mustFail) {
        it(t('user', 'new', 'Should be able to create a new instance or not.', mustFail), async function() {
            // Setup
            const instance = await ATMSettings.new();
            const settingsAddress = settingsIndex === -1 ? NULL_ADDRESS : settingsIndex === 99 ? accounts[2] : mocks[settingsIndex];

            try {
                // Invocation
                const result = await instance.initialize(settingsAddress);
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                const initialized = await instance.initialized();
                assert(initialized);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});