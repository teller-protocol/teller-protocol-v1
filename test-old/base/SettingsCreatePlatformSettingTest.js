// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require('leche').withData;
const {
    t,
    toBytes32,
} = require('../utils/consts');
const { settings } = require('../utils/events');
const { MAX_VALUE_STRING, MAX_VALUE } = require('../../config/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsCreatePlatformSettingTest', function (accounts) {
    const owner = accounts[0];
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await createTestSettingsInstance(Settings, { from: owner, Mock });
    });

    const newSetting = (name, value, min = 0, max = value * 2) => ({name, nameBytes32: toBytes32(web3, name), value, min, max});

    withData({
        _1_valid: [
            [
                newSetting('customSetting', 1000, 0, 9000),
                newSetting('customSetting2', 1000, 0, 9000)
            ],
            0, newSetting('mySetting', 1000, 0, 9000), undefined, false
        ],
        _2_invalid_value_lt_min: [
            [], 0, newSetting('mySetting', 1000, 1001, 9000), 'VALUE_MUST_BE_GTE_MIN_VALUE', true
        ],
        _3_valid_value_equal_min: [
            [], 0, newSetting('mySetting', 1000, 1000, 9000), undefined, false
        ],
        _4_invalid_value_gt_max: [
            [], 0, newSetting('mySetting', 8501, 1000, 8500), 'VALUE_MUST_BE_LTE_MAX_VALUE', true
        ],
        _5_valid_value_equal_max: [
            [], 0, newSetting('mySetting', 6000, 1000, 6000), undefined, false
        ],
        _6_invalid_already_exist: [
            [
                newSetting('customSetting3', 1000, 1000, 9000),
                newSetting('customSetting4', 2000, 2000, 9000),
                newSetting('customSetting5', 3000, 0, 9000)
            ],
            0, newSetting('customSetting5', 1000, 0, 9000), 'PLATFORM_SETTING_ALREADY_EXISTS', true
        ],
        _7_invalid_not_owner: [
            [
                newSetting('customSetting6', 1000, 1000, 9000),
                newSetting('customSetting7', 2000, 2000, 9000),
                newSetting('customSetting8', 3000, 0, 9000)
            ],
            1, newSetting('customSetting9', 1000, 0, 9000), 'NOT_PAUSER', true
        ],
        _8_valid_max_value: [
            [],
            0, newSetting('myCustomSettingA', 9000, 0, MAX_VALUE_STRING), undefined, false
        ],
        _9_invalid_max_value_overflow_uint256: [
            [],
            0, newSetting('myCustomSettingB', 9000, 0, MAX_VALUE.plus(1)), 'VALUE_MUST_BE_LTE_MAX_VALUE', true
        ],
        _10_invalid_min_value_underflow_uint256: [
            [],
            0, newSetting('myCustomSettingC', 9000, -1, 10000), 'VALUE_MUST_BE_GTE_MIN_VALUE', true
        ],
        _11_invalid_empty_name: [
            [], 0, newSetting('', 1000, 1001, 9000), 'SETTING_NAME_MUST_BE_PROVIDED', true
        ],
    }, function(previousSettings, senderIndex, newValue, expectedErrorMessage, mustFail) {
        it(t('user', `createPlatformSetting`, `Should (or not) be able to create a platform setting.`, mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            for (const previousSetting of previousSettings) {
                await instance.createPlatformSetting(
                    previousSetting.nameBytes32,
                    previousSetting.value,
                    previousSetting.min,
                    previousSetting.max,
                    { from: owner }
                );
            }

            try {
                // Invocation
                const result = await instance.createPlatformSetting(
                    newValue.nameBytes32,
                    newValue.value,
                    newValue.min,
                    newValue.max,
                    { from: sender }
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                settings
                    .platformSettingCreated(result)
                    .emitted(
                        newValue.nameBytes32,
                        sender,
                        newValue.value,
                        newValue.min,
                        newValue.max,
                    );
                
                const platformSettingResult = await instance.getPlatformSetting(
                    newValue.nameBytes32,
                );

                assert.equal(platformSettingResult.exists.toString(), 'true');
                assert.equal(platformSettingResult.value.toString(), newValue.value.toString());
                assert.equal(platformSettingResult.min.toString(), newValue.min.toString());
                assert.equal(platformSettingResult.max.toString(), newValue.max.toString());
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});