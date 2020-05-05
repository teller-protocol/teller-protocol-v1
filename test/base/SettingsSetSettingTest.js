// JS Libraries
const withData = require('leche').withData;
const {
    t,
    REQUIRED_SUBMISSIONS,
    RESPONSE_EXPIRY_LENGTH,
    MAXIMUM_TOLERANCE,
    toBytes32,
} = require('../utils/consts');
const { settings } = require('../utils/events');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsSetSettingTest', function (accounts) {
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await Settings.new(1, 1, 1);
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
});