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
    NULL_ADDRESS,
} = require('../utils/consts');
const { settings } = require('../utils/events');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsSetSettingTest', function (accounts) {
    const INITIAL_VALUE = 1;
    const owner = accounts[0];
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

    withData({
        _1_basic: [0, 1, 4, true, 100, 240, 1000, 200, 5, undefined, false],
        _2_sender_not_allowed: [2, 1, 4, true, 100, 240, 1000, 200, 5, 'PauserRole: caller does not have the Pauser role', true],
        _3_new_max_amount: [0, 2, 4, true, 1000, 3000, 1000, 2500, 5, undefined, false],
        _4_new_rate_process_freq: [0, 2, 4, true, 1000, 3000, 100, 3000, 4, undefined, false],
        _5_new_cToken_address: [0, 2, 4, true, 1000, 3000, 100, 3000, 5, undefined, false],
        _6_new_value_required: [0, 2, 4, true, 1000, 3000, 1000, 3000, 4, 'NEW_SETTINGS_VALUE_REQUIRED', true],
        _7_not_exist: [0, 2, 4, false, 1000, 3000, 1200, 3200, 5, 'ASSET_SETTINGS_NOT_EXISTS', true],
    }, function(senderIndex, lendingTokenIndex, cTokenIndex, preInitialize, currentMaxAmount, currentRateProcessFrequency, newMaxAmount, newRateProcessFrequency, newCTokenIndex, expectedErrorMessage, mustFail) {
        it(t('user', 'updateAssetSettings', 'Should (or not) be able to update the asset settings.', mustFail), async function() {
            // Setup
            const cTokenAddress = cTokenIndex === -1 ? NULL_ADDRESS : accounts[cTokenIndex];
            const newCTokenAddress = newCTokenIndex === -1 ? NULL_ADDRESS : accounts[newCTokenIndex];
            const lendingTokenAddress = lendingTokenIndex === -1 ? NULL_ADDRESS : accounts[lendingTokenIndex];
            const sender = accounts[senderIndex];
            if (preInitialize) {
                await instance.createAssetSettings(
                    lendingTokenAddress,
                    cTokenAddress,
                    currentMaxAmount,
                    currentRateProcessFrequency,
                    { from: owner }
                );
            }

            try {
                // Invocation
                const result = await instance.updateAssetSettings(lendingTokenAddress, newCTokenAddress, newMaxAmount, newRateProcessFrequency, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .assertSettingsUpdated(result)
                    .emitted(sender, lendingTokenAddress, newCTokenAddress, newMaxAmount, newRateProcessFrequency);
                
                const assetsResult = await instance.getAssets();
                assert(assetsResult.includes(lendingTokenAddress), 'Assets must include lending token address');

                const assetSettingsResult = await instance.getAssetSettings(lendingTokenAddress);
                assert.equal(assetSettingsResult.cTokenAddress, newCTokenAddress); 
                assert.equal(assetSettingsResult.maxLendingAmount, newMaxAmount.toString()); 
                assert.equal(assetSettingsResult.rateProcessFrequency, newRateProcessFrequency.toString()); 
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_with_cToken_basic: [0, 3, 1, false, 100, 240, undefined, false],
        _2_with_cToken_already_created: [0, 3, 1, true, 100, 240, 'ASSET_SETTINGS_ALREADY_EXISTS', true],
        _3_with_cToken_set_0_max_amount: [0, 3, 1, false, 0, 240, 'INIT_MAX_AMOUNT_REQUIRED', true],
        _4_with_cToken_set_0_rate_process_freq: [0, 3, 1, false, 4000, 0, 'INIT_RATE_PROCESS_FREQ_REQUIRED', true],
        _5_without_cToken_basic: [0, -1, 1, false, 100, 240, undefined, false],
        _6_without_cToken_already_created: [0, -1, 1, true, 100, 240, 'ASSET_SETTINGS_ALREADY_EXISTS', true],
        _7_without_cToken_set_0_max_amount: [0, -1, 1, false, 0, 240, 'INIT_MAX_AMOUNT_REQUIRED', true],
        _8_without_cToken_set_0_rate_process_freq: [0, -1, 1, false, 4000, 0, 'INIT_RATE_PROCESS_FREQ_REQUIRED', true],
    }, function(senderIndex, cTokenIndex, lendingTokenIndex, preInitialize, currentMaxAmount, currentRateProcessFrequency, expectedErrorMessage, mustFail) {
        it(t('user', 'createAssetSettings', 'Should (or not) be able to create asset settings.', mustFail), async function() {
            // Setup
            const lendingTokenAddress = lendingTokenIndex === -1 ? NULL_ADDRESS : accounts[lendingTokenIndex];
            const cTokenAddress = cTokenIndex === -1 ? NULL_ADDRESS : accounts[cTokenIndex];
            const sender = accounts[senderIndex];
            if(preInitialize) {
                await instance.createAssetSettings(
                    lendingTokenAddress,
                    cTokenAddress,
                    currentMaxAmount,
                    currentRateProcessFrequency,
                    { from: owner }
                );
            }

            try {
                // Invocation
                const result = await instance.createAssetSettings(
                    lendingTokenAddress,
                    cTokenAddress,
                    currentMaxAmount,
                    currentRateProcessFrequency,
                    { from: sender }
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .assertSettingsCreated(result)
                    .emitted(sender, lendingTokenAddress, cTokenAddress, currentMaxAmount, currentRateProcessFrequency);
                
                const assetsResult = await instance.getAssets();
                assert(assetsResult.includes(lendingTokenAddress), 'Assets must include lending token address');

                const assetSettingsResult = await instance.getAssetSettings(lendingTokenAddress);
                assert.equal(assetSettingsResult.cTokenAddress, cTokenAddress); 
                assert.equal(assetSettingsResult.maxLendingAmount, currentMaxAmount.toString()); 
                assert.equal(assetSettingsResult.rateProcessFrequency, currentRateProcessFrequency.toString()); 
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});