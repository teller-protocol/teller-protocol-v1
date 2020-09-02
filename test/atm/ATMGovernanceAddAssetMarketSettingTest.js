// JS Libraries
const withData = require('leche').withData;
const {
    t,
    toBytes32
} = require('../utils/consts');
const {
    DUMMY_ADDRESS,
    NULL_ADDRESS
} = require('../../test/utils/consts');
const {
    atmGovernance
} = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");

contract('ATMGovernanceAddAssetMarketSettingTest', function (accounts) {
    const owner = accounts[0];
    let instance;
    let settingsInstance;

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        instance = await ATMGovernance.new();
        await instance.initialize(settingsInstance.address, owner);
    });

    // Testing values
    const SETTING_NAME = toBytes32(web3, 'supplyToDebtRatio');
    const SETTING_VALUE = 5044;
    const INVALID_SETTING_VALUE = 0;
    const EMPTY_SETTING_NAME = toBytes32(web3, '');

    withData({
        _1_basic: [0, SETTING_NAME, SETTING_VALUE, undefined, false],
        _2_notSigner: [2, SETTING_NAME, SETTING_VALUE, 'SignerRole: caller does not have the Signer role', true],
        _3_emptySettingName: [0, EMPTY_SETTING_NAME, SETTING_VALUE, 'ASSET_SETTING_MUST_BE_PROVIDED', true],
        _4_invalidSettingValue: [0, EMPTY_SETTING_NAME, INVALID_SETTING_VALUE, 'ASSET_SETTING_MUST_BE_POSITIVE', true],
        _5_wrongNameFormat: [0, "nameNotBytes32", SETTING_VALUE, 'invalid bytes32 value', true],
    }, function (senderIndex, settingName, settingValue, expectedErrorMessage, mustFail) {
        it(t('user', 'addAssetMarketSetting#1', 'Should (or not) be able to add an asset market setting.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            const assetContract = await Mock.new();
            const assetAddress = assetContract.address;
            try {
 
                // Invocation
                const result = await instance.addAssetMarketSetting(assetAddress, settingName, settingValue, {
                    from: sender
                });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were modified
                const aSettingValue = await instance.getAssetMarketSetting(assetAddress, settingName);
                assert.equal(aSettingValue, settingValue);

                // Validating events were emitted
                atmGovernance
                    .assetMarketSettingAdded(result)
                    .emitted(sender, assetAddress, settingName, settingValue);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    // Testing add a duplicate
    withData({
        _1_duplicateAdd: [0, SETTING_NAME, SETTING_VALUE, 'ASSET_SETTING_ALREADY_EXISTS', true],
    }, function (senderIndex, settingName, settingValue, expectedErrorMessage, mustFail) {
        it(t('user', 'addAssetMarketSetting#2', 'Should not be able to add an asset market setting twice.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            const assetContract = await Mock.new();
            const assetAddress = assetContract.address;
            try {
                // Invocation
                const result1 = await instance.addAssetMarketSetting(assetAddress, settingName, settingValue, {
                    from: sender
                });
                assert(result1);
                const result2 = await instance.addAssetMarketSetting(assetAddress, settingName, settingValue, {
                    from: sender
                });
                assert(result2);

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    // Testing address type
    withData({
        _1_nullAsset: [0, NULL_ADDRESS, SETTING_NAME, SETTING_VALUE, 'ASSET_ADDRESS_IS_REQUIRED', true],
        _1_notContractAddress: [0, DUMMY_ADDRESS, SETTING_NAME, SETTING_VALUE, 'ASSET_MUST_BE_A_CONTRACT', true],
    }, function (senderIndex, asset, settingName, settingValue, expectedErrorMessage, mustFail) {
        it(t('user', 'addAssetMarketSetting#3', 'Should not be able to add an asset market setting to a non-contract address.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            try {
                // Invocation
                const result = await instance.addAssetMarketSetting(asset, settingName, settingValue, {
                    from: sender
                });
                assert(result);

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

});