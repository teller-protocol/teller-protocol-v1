// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');
const { atmSettings } = require('../utils/events');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");

contract('ATMSettingsPauseATMTest', function (accounts) {
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
        _1_basic: [[], 0, 1, true, true, false, undefined, false],
        _2_basic_previous_atms: [[1, 2, 3], 5, 1, true, true, false, undefined, false],
        _3_sender_not_pauser_role: [[], 0, 1, true, false, false, 'NOT_PAUSER', true],
        _4_platform_already_paused: [[], 0, 1, true, true, true, 'PLATFORM_IS_ALREADY_PAUSED', true],
        _5_atm_already_paused: [[1, 2], 2, 1, true, true, false, 'ATM_IS_ALREADY_PAUSED', true],
    }, function(previousATMs, atmIndex, senderIndex, encodeIsATM, encodeHasPauserRole, encodeIsPaused, expectedErrorMessage, mustFail) {
        it(t('user', 'pauseATM', 'Should (or not) be able to pause an ATM.', mustFail), async function() {
            // Setup
            for (const previousATMIndex of previousATMs) {
                await instance.pauseATM(mocks[previousATMIndex], { from: owner });
            }
            const sender = accounts[senderIndex];
            const atmAddress = atmIndex === -1 ? NULL_ADDRESS : mocks[atmIndex];
            await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeHasPauserRole(), encodeHasPauserRole);
            await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeIsPaused(), encodeIsPaused);


            try {
                // Invocation
                const result = await instance.pauseATM(atmAddress, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');

                const isATMPausedResult = await instance.isATMPaused(atmAddress);
                assert.equal(isATMPausedResult, true, 'ATM should be paused.');

                atmSettings
                    .atmPaused(result)
                    .emitted(atmAddress, sender);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});