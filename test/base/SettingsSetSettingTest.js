// JS Libraries
const withData = require('leche').withData;
const {
    t,
    REQUIRED_SUBMISSIONS,
    RESPONSE_EXPIRY_LENGTH,
    MAXIMUM_TOLERANCE,
    SAFETY_INTERVAL,
    TERMS_EXPIRY_TIME,
    LIQUIDATE_ETH_PRICE,
    toBytes32,
    minutesToSeconds,
} = require('../utils/consts');
const { settings } = require('../utils/events');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsSetSettingTest', function (accounts) {
    const INITIAL_VALUE = 1;
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await Settings.new(
            INITIAL_VALUE, // Sets RequiredSubmissions
            INITIAL_VALUE, // Sets MaximumTolerance
            INITIAL_VALUE, // Sets ResponseExpiryLength
            INITIAL_VALUE, // Sets SafetyInterval
            INITIAL_VALUE, // Sets TermsExpiryTime
            INITIAL_VALUE // Sets LiquidateEthPrice
        );
    });

    withData({
        _1_basic: [0, 2, undefined, false],
        _2_zero: [0, 0, 'MUST_PROVIDE_REQUIRED_SUBS', true],
        _3_new_value_required: [0, 1, 'NEW_VALUE_REQUIRED', true],
    }, function(senderIndex, newValue, expectedErrorMessage, mustFail) {
        it(t('user', 'setRequiredSubmissions', 'Should (or not) be able to set a new required submissions value.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const oldValue = await instance.requiredSubmissions();

            try {
                // Invocation
                const result = await instance.setRequiredSubmissions(newValue, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .settingUpdated(result)
                    .emitted(toBytes32(web3, REQUIRED_SUBMISSIONS), sender, oldValue, newValue);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_basic: [0, 2, undefined, false],
        _2_zero: [0, 0, undefined, false],
        _3_new_value_required: [0, 1, 'NEW_VALUE_REQUIRED', true],
        _4_basic_2: [0, 5500, undefined, false],
        _5_max_exceeded: [0, 10001, 'MAX_TOLERANCE_EXCEEDED', true],
        _6_max_limit: [0, 10000, undefined, false],
    }, function(senderIndex, newValue, expectedErrorMessage, mustFail) {
        it(t('user', 'setMaximumTolerance', 'Should (or not) be able to set a new maximum tolerance value.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const oldValue = await instance.maximumTolerance();

            try {
                // Invocation
                const result = await instance.setMaximumTolerance(newValue, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .settingUpdated(result)
                    .emitted(toBytes32(web3, MAXIMUM_TOLERANCE), sender, oldValue, newValue);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_basic: [0, 2, undefined, false],
        _2_zero: [0, 0, 'MUST_PROVIDE_RESPONSE_EXP', true],
        _3_new_value_required: [0, 1, 'NEW_VALUE_REQUIRED', true],
    }, function(senderIndex, newValue, expectedErrorMessage, mustFail) {
        it(t('user', 'setResponseExpiryLength', 'Should (or not) be able to set a new response expiry length value.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const oldValue = await instance.responseExpiryLength();

            try {
                // Invocation
                const result = await instance.setResponseExpiryLength(newValue, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .settingUpdated(result)
                    .emitted(toBytes32(web3, RESPONSE_EXPIRY_LENGTH), sender, oldValue, newValue);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_basic: [0, minutesToSeconds(2), undefined, false],
        _2_zero: [0, 0, 'MUST_PROVIDE_SAFETY_INTERVAL', true],
        _3_new_value_required: [0, INITIAL_VALUE, 'NEW_VALUE_REQUIRED', true],
    }, function(senderIndex, newValue, expectedErrorMessage, mustFail) {
        it(t('user', 'setSafetyInterval', 'Should (or not) be able to set a new safety interval value.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const oldValue = await instance.safetyInterval();

            try {
                // Invocation
                const result = await instance.setSafetyInterval(newValue, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .settingUpdated(result)
                    .emitted(toBytes32(web3, SAFETY_INTERVAL), sender, oldValue, newValue);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_basic: [0, minutesToSeconds(100), undefined, false],
        _2_zero: [0, 0, 'MUST_PROVIDE_TERMS_EXPIRY', true],
        _3_new_value_required: [0, 1, 'NEW_VALUE_REQUIRED', true],
    }, function(senderIndex, newValue, expectedErrorMessage, mustFail) {
        it(t('user', 'setTermsExpiryTime', 'Should (or not) be able to set a new terms expiry time value.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const oldValue = await instance.safetyInterval();

            try {
                // Invocation
                const result = await instance.setTermsExpiryTime(newValue, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .settingUpdated(result)
                    .emitted(toBytes32(web3, TERMS_EXPIRY_TIME), sender, oldValue, newValue);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_basic: [0, 8100, undefined, false],
        _2_zero: [0, 0, 'MUST_PROVIDE_ETH_PRICE', true],
        _3_new_value_required: [0, 1, 'NEW_VALUE_REQUIRED', true],
    }, function(senderIndex, newValue, expectedErrorMessage, mustFail) {
        it(t('user', 'setLiquidateEthPrice', 'Should (or not) be able to set a new liquidate ETH price value.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const oldValue = await instance.safetyInterval();

            try {
                // Invocation
                const result = await instance.setLiquidateEthPrice(newValue, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .settingUpdated(result)
                    .emitted(toBytes32(web3, LIQUIDATE_ETH_PRICE), sender, oldValue, newValue);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});