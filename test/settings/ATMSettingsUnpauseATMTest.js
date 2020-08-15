// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');
const { atmSettings } = require('../utils/events');
const IATMFactoryEncoder = require('../utils/encoders/IATMFactoryEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");

contract('ATMSettingsUnpauseATMTest', function (accounts) {
    const atmFactoryInterfaceEncoder = new IATMFactoryEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    const owner = accounts[0];
    let instance;
    let atmFactory;
    let settings;
    let mocks;
    
    beforeEach('Setup for each test', async () => {
        mocks = await createMocks(Mock, 10);
        atmFactory = await Mock.new();
        settings = await Mock.new();
        instance = await ATMSettings.new(atmFactory.address, settings.address);
    });

    withData({
        _1_basic_previous_atm: [[0, 2, 4], 0, 1, true, true, false, undefined, false],
        _2_basic: [[0], 0, 1, true, true, false, undefined, false],
        _3_invalid_atm: [[], 0, 1, false, true, false, 'ADDRESS_ISNT_ATM', true],
        _4_invalid_atm_previous: [[1, 5, 3], 0, 1, false, true, false, 'ADDRESS_ISNT_ATM', true],
        _5_sender_not_pauser_role: [[], 0, 1, true, false, true, 'SENDER_HASNT_PAUSER_ROLE', true],
        _6_platform_already_paused: [[1, 2, 3], 0, 1, true, true, true, 'PLATFORM_IS_PAUSED', true],
        _7_atm_not_paused: [[1, 2], 3, 1, true, true, false, 'ATM_IS_NOT_PAUSED', true],
    }, function(previousATMs, atmIndex, senderIndex, encodeIsATM, encodeHasPauserRole, encodeIsPaused, expectedErrorMessage, mustFail) {
        it(t('user', 'unpauseATM', 'Should (or not) be able to unpause an ATM.', mustFail), async function() {
            // Setup
            await atmFactory.givenMethodReturnBool(atmFactoryInterfaceEncoder.encodeIsATM(), true);
            await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeHasPauserRole(), true);
            await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeIsPaused(), false);
            for (const previousATMIndex of previousATMs) {
                await instance.pauseATM(mocks[previousATMIndex], { from: owner });
            }
            const sender = accounts[senderIndex];
            const atmAddress = atmIndex === -1 ? NULL_ADDRESS : mocks[atmIndex];
            await atmFactory.givenMethodReturnBool(atmFactoryInterfaceEncoder.encodeIsATM(), encodeIsATM);
            await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeHasPauserRole(), encodeHasPauserRole);
            await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeIsPaused(), encodeIsPaused);

            try {
                // Invocation
                const result = await instance.unpauseATM(atmAddress, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');

                const isATMPausedResult = await instance.isATMPaused(atmAddress);
                assert.equal(isATMPausedResult, false, 'ATM should be unpaused.');

                atmSettings
                    .atmUnpaused(result)
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