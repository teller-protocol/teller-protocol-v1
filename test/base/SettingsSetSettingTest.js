// JS Libraries
const withData = require('leche').withData;
const {
    t,
    toBytes32,
    NULL_ADDRESS,
    daysToSeconds,
} = require('../utils/consts');
const getSettingsMaps = require('../utils/settings-map');
const { settings } = require('../utils/events');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsSetSettingTest', function (accounts) {
    const settingsMap = getSettingsMaps();
    const INITIAL_VALUE = 1;
    const INITIAL_MAXIMUM_LOAN_DURATION_VALUE = daysToSeconds(30);
    const owner = accounts[0];
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await Settings.new(
            INITIAL_VALUE, // Sets RequiredSubmissions
            INITIAL_VALUE, // Sets MaximumTolerance
            INITIAL_VALUE, // Sets ResponseExpiryLength
            INITIAL_VALUE, // Sets SafetyInterval
            INITIAL_VALUE, // Sets TermsExpiryTime
            INITIAL_VALUE, // Sets LiquidateEthPrice
            INITIAL_MAXIMUM_LOAN_DURATION_VALUE, // Sets MaximumLoanDuration
            INITIAL_VALUE, // Sets StartingBlockNumber
        );
    });

    withData({
        _1_maximumLoanDuration_valid: ['maximumLoanDuration', 0, 1000, 8100, undefined, false],
        _2_maximumLoanDuration_not_zero: ['maximumLoanDuration', 0, 2000, 0, 'MUST_PROVIDE_MAXIMUM_LOAN_DURATION', true],
        _3_maximumLoanDuration_equal: ['maximumLoanDuration', 0, 3000, 3000, 'NEW_VALUE_REQUIRED', true],
        _4_maximumLoanDuration_not_owner: ['maximumLoanDuration', 1, 4000, 3000, 'PauserRole: caller does not have the Pauser role', true],

        _1_safetyInterval_valid: ['safetyInterval', 0, 100, 2000, undefined, false],
        _2_safetyInterval_not_zero: ['safetyInterval', 0, 1000, 0, 'MUST_PROVIDE_SAFETY_INTERVAL', true],
        _3_safetyInterval_equal: ['safetyInterval', 0, 2500, 2500, 'NEW_VALUE_REQUIRED', true],
        _4_safetyInterval_not_owner: ['safetyInterval', 1, 4000, 3000, 'PauserRole: caller does not have the Pauser role', true],

        _1_maximumTolerance_valid: ['maximumTolerance', 0, 100, 2000, undefined, false],
        _2_maximumTolerance_zero: ['maximumTolerance', 0, 1000, 0, undefined, false],
        _3_maximumTolerance_equal: ['maximumTolerance', 0, 2500, 2500, 'NEW_VALUE_REQUIRED', true],
        _4_maximumTolerance_zero_equal: ['maximumTolerance', 0, 0, 0, 'NEW_VALUE_REQUIRED', true],
        _5_maximumTolerance_not_owner: ['maximumTolerance', 1, 4000, 3000, 'PauserRole: caller does not have the Pauser role', true],
        _6_maximumTolerance_exceeds_max: ['maximumTolerance', 0, 5000, 10001, 'MAX_TOLERANCE_EXCEEDED', true],
        _7_maximumTolerance_set_max: ['maximumTolerance', 0, 9000, 10000, undefined, false],
    
        _1_requiredSubmissions_valid: ['requiredSubmissions', 0, 7, 2, undefined, false],
        _2_requiredSubmissions_not_zero: ['requiredSubmissions', 0, 5, 0, 'MUST_PROVIDE_REQUIRED_SUBS', true],
        _3_requiredSubmissions_equal: ['requiredSubmissions', 0, 8, 8, 'NEW_VALUE_REQUIRED', true],
        _4_requiredSubmissions_not_owner: ['requiredSubmissions', 1, 11, 12, 'PauserRole: caller does not have the Pauser role', true],
    
        _1_responseExpiryLength_valid: ['responseExpiryLength', 0, 700, 250, undefined, false],
        _2_responseExpiryLength_not_zero: ['responseExpiryLength', 0, 550, 0, 'MUST_PROVIDE_RESPONSE_EXP', true],
        _3_responseExpiryLength_equal: ['responseExpiryLength', 0, 800, 800, 'NEW_VALUE_REQUIRED', true],
        _4_responseExpiryLength_not_owner: ['responseExpiryLength', 1, 1000, 1200, 'PauserRole: caller does not have the Pauser role', true],
    
        _1_termsExpiryTime_valid: ['termsExpiryTime', 0, 800, 2500, undefined, false],
        _2_termsExpiryTime_not_zero: ['termsExpiryTime', 0, 1550, 0, 'MUST_PROVIDE_TERMS_EXPIRY', true],
        _3_termsExpiryTime_equal: ['termsExpiryTime', 0, 1100, 1100, 'NEW_VALUE_REQUIRED', true],
        _4_termsExpiryTime_not_owner: ['termsExpiryTime', 1, 1000, 1200, 'PauserRole: caller does not have the Pauser role', true],

        _1_liquidateEthPrice_valid: ['liquidateEthPrice', 0, 9000, 2500, undefined, false],
        _2_liquidateEthPrice_not_zero: ['liquidateEthPrice', 0, 1550, 0, 'MUST_PROVIDE_ETH_PRICE', true],
        _3_liquidateEthPrice_equal: ['liquidateEthPrice', 0, 1100, 1100, 'NEW_VALUE_REQUIRED', true],
        _4_liquidateEthPrice_not_owner: ['liquidateEthPrice', 1, 1000, 1200, 'PauserRole: caller does not have the Pauser role', true],
    
        _1_startingBlockNumber_valid: ['startingBlockNumber', 0, 900000, 920000, undefined, false],
        _2_startingBlockNumber_not_zero: ['startingBlockNumber', 0, 1550, 0, 'MUST_PROVIDE_START_BLOCK_NUMBER', true],
        _3_startingBlockNumber_equal: ['startingBlockNumber', 0, 1000100, 1000100, 'NEW_VALUE_REQUIRED', true],
        _4_startingBlockNumber_not_owner: ['startingBlockNumber', 1, 1000, 1200, 'PauserRole: caller does not have the Pauser role', true],
    }, function(settingKey, senderIndex, currentValue, newValue, expectedErrorMessage, mustFail) {
        const { set: setSettingValue, name: getSettingName } = settingsMap.get(settingKey);
        const settingName = getSettingName();
        it(t('user', `set${settingName}`, `Should (or not) be able to set a new ${settingKey} value.`, mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];

            await setSettingValue(instance, currentValue, { from: owner });

            try {
                // Invocation
                const result = await setSettingValue(instance, newValue, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .settingUpdated(result)
                    .emitted(toBytes32(web3, settingName), sender, currentValue, newValue);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_maximumLoanDuration: ['maximumLoanDuration', 1000],
        _2_safetyInterval: ['safetyInterval', 2000],
        _3_maximumTolerance: ['maximumTolerance', 1200],
        _4_requiredSubmissions: ['requiredSubmissions', 4],
        _5_responseExpiryLength: ['responseExpiryLength', 735],
        _6_termsExpiryTime: ['termsExpiryTime', 2225],
        _7_liquidateEthPrice: ['liquidateEthPrice', 9325],
        _8_startingBlockNumber: ['startingBlockNumber', 1800000],
    }, function(settingKey, currentValue) {
        const { get: getSettingValue, set: setSettingValue, name: getSettingName } = settingsMap.get(settingKey);
        const settingName = getSettingName();
        it(t('user', `get${settingName}`, `Should be able to get the current ${settingKey} value.`, false), async function() {
            // Setup
            await setSettingValue(instance, currentValue, { from: owner });

            // Invocation
            const result = await getSettingValue(instance);

            // Assertions
            assert.equal(result.toString(), currentValue.toString());
        });
    });
});