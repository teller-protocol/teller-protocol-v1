// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, toDecimals, toBytes32 } = require('../utils/consts');
const { createAssetSettings } = require('../utils/asset-settings-helper');
const { settings } = require('../utils/events');
const getAssetSettingsMap = require('../utils/asset-settings-map');
const { createTestSettingsInstance } = require('../utils/settings-helper');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsUpdateAssetSettingsTest', function (accounts) {
    let owner = accounts[0];
    let assetSettingsMap;

    beforeEach('Setup for each test', async () => {
        assetSettingsMap = getAssetSettingsMap();
    });

    const createSettingInfo = (maxAmount, maxAmountDecimals, riskPremiumInterestRate) => {
        return { maxLoanAmount: toDecimals(maxAmount, maxAmountDecimals), riskPremiumInterestRate };
    };

    const getContractAddress = (addressIndex, defaultInstance) => {
        return addressIndex === -1 ? NULL_ADDRESS : (addressIndex === 99 ? defaultInstance.address: accounts[addressIndex]);
    }

    const getSenderAddress = (addressIndex) => {
        return addressIndex === -1 ? NULL_ADDRESS : accounts[addressIndex];
    }

    withData({
        _1_previous1_maxLoanAmount_valid: [
            [ createSettingInfo(100, 18) ],
            'maxLoanAmount', 0, 0, 21000, undefined, false
        ],
        _2_maxLoanAmount_invalid_same_value: [
            [ createSettingInfo(2500, 18) ],
            'maxLoanAmount', 0, 0, toDecimals(2500, 18), 'NEW_MAX_LOAN_AMOUNT_REQUIRED', true
        ],
        _3_maxLoanAmount_invalid_zero: [
            [ createSettingInfo(2500, 18) ],
            'maxLoanAmount', 0, 0, 0, 'MAX_LOAN_AMOUNT_NOT_ZERO', true
        ],
        _4_previous1_maxLoanAmount_valid: [
            [ createSettingInfo(100, 18) ],
            'maxLoanAmount', 0, 0, 21000, undefined, false
        ],
        _5_invalid_asset_not_exists: [
            [ createSettingInfo(100, 18) ],
            'maxLoanAmount', 0, -1, 21000, 'ASSET_SETTINGS_NOT_EXISTS', true
        ],
    }, function(
        previousAssetsInfo,
        assetSettingKey,
        senderIndex,
        assetToUpdateIndex,
        newValue,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'updateSettingName (uint)', 'Should (or not) be able to update an asset setting (uint).', mustFail), async function() {
            // Setup
            const { set: setAssetSettingValue, get: getAssetSettingValue, name: getAssetSettingName } = assetSettingsMap.get(assetSettingKey);
            const assetSettingName = getAssetSettingName();
            const senderAddress = getSenderAddress(senderIndex);
            const instance = await createTestSettingsInstance(Settings);

            const currentAssetsInfo = await createAssetSettings(Mock, instance, owner, previousAssetsInfo);
            const assetAddressToUpdate = assetToUpdateIndex === -1 ? (await Mock.new()).address : currentAssetsInfo[assetToUpdateIndex].assetAddress;
            const beforeAssets = await instance.getAssets();
            
            try {
                // Invocation
                const result = await setAssetSettingValue(
                    instance,
                    assetAddressToUpdate,
                    newValue,
                    { from: senderAddress },
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .assetSettingsUintUpdated(result)
                    .emitted(
                        toBytes32(web3, assetSettingName),
                        senderAddress,
                        assetAddressToUpdate,
                        currentAssetsInfo[assetToUpdateIndex].maxLoanAmount,
                        newValue,
                    );

                const currentUpdatedValueResult = await getAssetSettingValue(instance, assetAddressToUpdate);
                assert.equal(currentUpdatedValueResult[assetSettingKey].toString(), newValue.toString());

                const afterAssets = await instance.getAssets();
                assert.equal(afterAssets.length, beforeAssets.length);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_cTokenAddress_valid: [
            [ createSettingInfo(100, 18) ],
            'cTokenAddress', 0, 0, 99, undefined, false
        ],
        _2_cTokenAddress_same_new_value: [
            [ createSettingInfo(100, 18) ],
            'cTokenAddress', 0, 0, -1, 'NEW_CTOKEN_ADDRESS_REQUIRED', true
        ],
    }, function(
        previousAssetsInfo,
        assetSettingKey,
        senderIndex,
        assetToUpdateIndex,
        newValueIndex,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'updateSettingName (address)', 'Should (or not) be able to update an asset setting (address).', mustFail), async function() {
            // Setup
            const { set: setAssetSettingValue, get: getAssetSettingValue, name: getAssetSettingName } = assetSettingsMap.get(assetSettingKey);
            const assetSettingName = getAssetSettingName();
            const senderAddress = getSenderAddress(senderIndex);
            const instance = await createTestSettingsInstance(Settings);

            const currentAssetsInfo = await createAssetSettings(Mock, instance, owner, previousAssetsInfo);
            const assetAddressToUpdate = assetToUpdateIndex === -1 ? (await Mock.new()) : currentAssetsInfo[assetToUpdateIndex].assetAddress;
            const beforeAssets = await instance.getAssets();
            // If newValueIndex is -1, we use the same current asset address as new value (it should fail).
            const newValue = newValueIndex === -1 ? currentAssetsInfo[assetToUpdateIndex].cTokenAddress : getContractAddress(newValueIndex, (await Mock.new()));
            try {
                // Invocation
                const result = await setAssetSettingValue(
                    instance,
                    assetAddressToUpdate,
                    newValue,
                    { from: senderAddress },
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .assetSettingsAddressUpdated(result)
                    .emitted(
                        toBytes32(web3, assetSettingName),
                        senderAddress,
                        assetAddressToUpdate,
                        currentAssetsInfo[assetToUpdateIndex].cTokenAddress,
                        newValue,
                    );

                const currentUpdatedValueResult = await getAssetSettingValue(instance, assetAddressToUpdate);
                assert.equal(currentUpdatedValueResult[assetSettingKey].toString(), newValue.toString());

                const afterAssets = await instance.getAssets();
                assert.equal(afterAssets.length, beforeAssets.length);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});