// JS Libraries
const IATMSettingsEncoder = require("../utils/encoders/IATMSettingsEncoder");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require('leche').withData;
const {
    t,
    toBytes32
} = require('../utils/consts');
const {
    atmGovernance
} = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('ATMGovernanceUpdateAssetMarketSettingTest', function (accounts) {
    const encoder = new IATMSettingsEncoder(web3)
    let instance;

    beforeEach('Setup for each test', async () => {
        const settings = await createTestSettingsInstance(Settings);
        const atmSettings = await Mock.new();
        await atmSettings.givenMethodReturnAddress(
            encoder.encodeSettings(),
            settings.address
        );

        instance = await ATMGovernance.new();
        await instance.initialize(atmSettings.address);
    });

    // Testing values
    const SETTING_NAME = toBytes32(web3, 'supplyToDebtRatio');
    const NOT_INSERTED_SETTING_NAME = toBytes32(web3, 'neverAdded');
    const SETTING_OLD_VALUE = 5044;
    const SETTING_NEW_VALUE = 1111;
    const EMPTY_SETTING_NAME = toBytes32(web3, '');

    withData({
        _1_basic: [0, SETTING_NAME, SETTING_NEW_VALUE, undefined, false],
        _2_notSigner: [2, SETTING_NAME, SETTING_NEW_VALUE, 'ONLY_PAUSER', true],
        _3_sameOldValue: [0, SETTING_NAME, SETTING_OLD_VALUE, 'NEW_VALUE_SAME_AS_OLD', true],
    }, function (senderIndex, settingName, newValue, expectedErrorMessage, mustFail) {
        it(t('user', 'updateAssetMarketSetting#1', 'Should (or not) be able to update an asset market setting.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            const validSender = accounts[0];
            const assetContract = await Mock.new();
            const assetAddress = assetContract.address;

            // Precondition
            await instance.addAssetMarketSetting(assetAddress, settingName, SETTING_OLD_VALUE, {from: validSender});

            try {
                // Invocation
                const result = await instance.updateAssetMarketSetting(assetAddress, settingName, newValue, {from: sender});

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were modified
                const aSettingValue = await instance.getAssetMarketSetting(assetAddress, settingName);
                assert.equal(aSettingValue, newValue);

                // Validating events were emitted
                atmGovernance
                    .assetMarketSettingUpdated(result)
                    .emitted(sender, assetAddress, settingName, SETTING_OLD_VALUE, newValue);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_emptySettingName: [0, EMPTY_SETTING_NAME, 'ASSET_SETTING_MUST_BE_PROVIDED', true],
        _2_settingNotFound: [0, NOT_INSERTED_SETTING_NAME, 'ASSET_SETTING_NOT_FOUND', true],
        _3_wrongNameFormat: [0, "nameNotBytes32", 'invalid bytes32 value', true],
    }, function (senderIndex, settingName, expectedErrorMessage, mustFail) {
        it(t('user', 'updateAssetMarketSetting#2', 'Should (or not) be able to update an asset market setting.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            const assetContract = await Mock.new();
            const assetAddress = assetContract.address;

            try {
                // Invocation
                const result = await instance.updateAssetMarketSetting(assetAddress, settingName, SETTING_OLD_VALUE, {from: sender});

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });


});