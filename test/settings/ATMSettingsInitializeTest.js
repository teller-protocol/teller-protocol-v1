// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");

contract('ATMSettingsInitializeTest', function (accounts) {
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let mocks;

    beforeEach('Setup for each test', async () => {
        settings = await Mock.new();
        await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeHasPauserRole(), true);
        await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeIsPaused(), false);

        mocks = await createMocks(Mock, 10);
    });

    withData({
        _1_basic: [4, undefined, false],
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