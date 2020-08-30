// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");

contract('ATMSettingsIsATMPausedTest', function (accounts) {
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    const owner = accounts[0];
    let instance;
    let settings;
    let mocks;
    
    beforeEach('Setup for each test', async () => {
        mocks = await createMocks(Mock, 10);
        settings = await Mock.new();
        instance = await ATMSettings.new();
        await instance.initialize(settings.address);
    });

    withData({
        _1_notPaused: [[1, 2, 3], 4, false],
        _2_paused: [[1, 2, 3], 2, true],
    }, function(previousATMs, atmIndex, expectedResult) {
        it(t('user', 'isATMPaused', 'Should be able to test whether an ATM is paused or not.', false), async function() {
            // Setup
            await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeHasPauserRole(), true);
            await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeIsPaused(), false);
            for (const previousATMIndex of previousATMs) {
                await instance.pauseATM(mocks[previousATMIndex], { from: owner });
            }
            const atmAddress = atmIndex === -1 ? NULL_ADDRESS : mocks[atmIndex];

            // Invocation
            const result = await instance.isATMPaused(atmAddress);
            
            // Assertions
            assert.equal(result, expectedResult);
        });
    });
});