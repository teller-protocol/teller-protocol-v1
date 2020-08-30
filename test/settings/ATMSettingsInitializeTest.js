// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");

contract('ATMSettingsInitializeTest', function (accounts) {
    let mocks;

    beforeEach('Setup for each test', async () => {
        settings = await Mock.new();
        await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeHasPauserRole(), true);
        await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeIsPaused(), false);

        mocks = await createMocks(Mock, 10);
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

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