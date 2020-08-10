// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");

contract('ATMSettingsConstructorTest', function (accounts) {
    let mocks;
    
    beforeEach('Setup for each test', async () => {
        mocks = await createMocks(Mock, 10);
    });

    withData({
        _1_basic: [1, 4, undefined, false],
        _2_empty_atm_factory: [-1, 5, 'ATM_GOV_FACTORY_MUST_BE_PROVIDED', true],
        _3_empty_settins: [3, -1, 'SETTINGS_MUST_BE_PROVIDED', true],
    }, function(atmFactoryIndex, settingsIndex, expectedErrorMessage, mustFail) {
        it(t('user', 'new', 'Should be able to create a new instance or not.', mustFail), async function() {
            // Setup
            const settingsAddress = settingsIndex === -1 ? NULL_ADDRESS : settingsIndex === 99 ? accouts[2] : mocks[settingsIndex];
            const atmFactoryAddress = atmFactoryIndex === -1 ? NULL_ADDRESS : atmFactoryIndex === 99 ? accouts[3] : mocks[atmFactoryIndex];

            try {
                // Invocation
                const result = await ATMSettings.new(atmFactoryAddress, settingsAddress);
                
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