// JS Libraries
const withData = require('leche').withData;
const {
    t,
    toBytes32,
} = require('../utils/consts');
const settingsNames = require('../utils/platformSettingsNames');
const { createTestSettingsInstance } = require("../utils/settings-helper");

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsGetAndHasPlatformSettingTest', function (accounts) {
    const owner = accounts[0];
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await createTestSettingsInstance(Settings);
    });

    const newSetting = (value, min = 0, max = value * 2) => ({value, min, max});

    withData({
        _1_maximumLoanDuration: [settingsNames.MaximumLoanDuration, newSetting(1000, 0, 1001)],
        _2_safetyInterval: [settingsNames.SafetyInterval, newSetting(1000, 200, 2000)],
        _3_maximumTolerance: [settingsNames.MaximumTolerance, newSetting(1200, 100, 2000)],
        _4_requiredSubmissions: [settingsNames.RequiredSubmissions, newSetting(400, 0, 4500)],
        _5_responseExpiryLength: [settingsNames.ResponseExpiryLength, newSetting(735, 0, 9000)],
        _6_termsExpiryTime: [settingsNames.TermsExpiryTime, newSetting(2225, 0, 20000)],
        _7_liquidateEthPrice: [settingsNames.LiquidateEthPrice, newSetting(9325, 9324, 10000)],
        _8_collateralBuffer: [settingsNames.CollateralBuffer, newSetting(1510, 1509, 1511)],
    }, function(settingKey, currentValue) {
        it(t('user', `getPlatformSetting`, `Should be able to get the current platform setting (${settingKey}) value.`, false), async function() {
            // Setup
            const settingsKeyBytes32 = toBytes32(web3, settingKey);
            await instance.createPlatformSetting(
                settingsKeyBytes32,
                currentValue.value,
                currentValue.min,
                currentValue.max,
                { from: owner }
            );

            // Invocation
            const result = await instance.getPlatformSetting(settingsKeyBytes32);

            // Assertions
            assert.equal(result.value.toString(), currentValue.value.toString());
            assert.equal(result.min.toString(), currentValue.min.toString());
            assert.equal(result.max.toString(), currentValue.max.toString());
            assert(result.exists.toString() === 'true');
        });
    });

    withData({
        _1_has: [settingsNames.MaximumLoanDuration, newSetting(1000, 0, 1001), settingsNames.MaximumLoanDuration, true],
        _2_hasnt: [settingsNames.MaximumTolerance, newSetting(1000, 0, 1001), settingsNames.RequiredSubmissions, false],
    }, function(settingKey, currentValue, settingNameToTest, expectedResult) {
        it(t('user', `hasPlatformSetting`, `Should be able to get the current platform setting (${settingKey}) value.`, false), async function() {
            // Setup
            const settingsKeyBytes32 = toBytes32(web3, settingKey);
            const settingNameToTestBytes32 = toBytes32(web3, settingNameToTest);
            await instance.createPlatformSetting(
                settingsKeyBytes32,
                currentValue.value,
                currentValue.min,
                currentValue.max,
                { from: owner }
            );

            // Invocation
            const result = await instance.hasPlatformSetting(settingNameToTestBytes32);

            // Assertions
            assert.equal(result.toString(), expectedResult.toString());
        });
    });
});