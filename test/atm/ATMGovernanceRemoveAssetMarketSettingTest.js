// JS Libraries
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

contract('ATMGovernanceRemoveAssetMarketSettingTest', function (accounts) {
    const owner = accounts[0];
    let instance;
    let settingsInstance;
    const ANY_VALUE = 1;

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        instance = await ATMGovernance.new();
        await instance.initialize(settingsInstance.address, owner, ANY_VALUE);
    });

    // Testing values
    const SETTING_NAME = toBytes32(web3, 'MaxDebtRatio');
    const NOT_INSERTED_SETTING_NAME = toBytes32(web3, 'neverAdded');
    const SETTING_VALUE = 5044;
    const SETTING_NOT_FOUND = 0;
    const EMPTY_SETTING_NAME = toBytes32(web3, '');

    withData({
        _1_basic: [0, SETTING_NAME, undefined, false],
        _2_notSigner: [2, SETTING_NAME, 'SignerRole: caller does not have the Signer role', true],
    }, function (senderIndex, settingName, expectedErrorMessage, mustFail) {
        it(t('user', 'removeAssetMarketSetting#1', 'Should (or not) be able to remove an asset market setting.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            const assetContract = await Mock.new();
            const assetAddress = assetContract.address;

            // Precondition
            await instance.addAssetMarketSetting(assetAddress, settingName, SETTING_VALUE);

            try {
    
                // Invocation
                const result = await instance.removeAssetMarketSetting(assetAddress, settingName, {
                    from: sender
                });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were modified
                const aSettingValue = await instance.getAssetMarketSetting(assetAddress, settingName);
                assert.equal(aSettingValue, SETTING_NOT_FOUND);

                // Validating events were emitted
                atmGovernance
                    .assetMarketSettingRemoved(result)
                    .emitted(sender, assetAddress, settingName, SETTING_VALUE);

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
        it(t('user', 'removeAssetMarketSetting#2', 'Should (or not) be able to remove an asset market setting.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            const assetContract = await Mock.new();
            const assetAddress = assetContract.address;

            try {
                // Invocation
                const result = await instance.removeAssetMarketSetting(assetAddress, settingName, {
                    from: sender
                });

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
