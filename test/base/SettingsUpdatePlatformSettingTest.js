// JS Libraries
const withData = require('leche').withData;
const {
    t,
    toBytes32,
} = require('../utils/consts');
const settingsNames = require('../utils/platformSettingsNames');
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { settings } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsUpdatePlatformSettingTest', function (accounts) {
    const owner = accounts[0];
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await createTestSettingsInstance(Settings, { from: owner, Mock }, {
            [settingsNames.TimelockDuration]: 0
        });
    });

    const newSetting = (value, min = 0, max = value * 2) => ({value, min, max});

    withData({
        _1_valid: ['settingName', 0, newSetting(1000, 0, 9000), 8100, undefined, false],
        _2_invalid_not_lt_min: ['settingName', 0, newSetting(2000, 1500, 5000), 500, 'NEW_VALUE_MUST_BE_GTE_MIN_VALUE', true],
        _3_invalid_not_gt_max: ['settingName', 0, newSetting(1000, 500, 6000), 9000, 'NEW_VALUE_MUST_BE_LTE_MAX_VALUE', true],
        _4_invalid_same_value: ['settingName', 0, newSetting(2000, 400, 6000), 2000, 'NEW_VALUE_REQUIRED', true],
        _5_invalid_not_owner: ['settingName', 1, newSetting(2000, 0, 7000), 5100, 'NOT_PAUSER', true],
    }, function(settingKey, senderIndex, currentValue, newValue, expectedErrorMessage, mustFail) {
        it(t('user', `updatePlatformSetting`, `Should (or not) be able to update a platform setting (${settingKey}).`, mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const settingsKeyBytes32 = toBytes32(web3, settingKey);

            await instance.createPlatformSetting(
                settingsKeyBytes32,
                currentValue.value,
                currentValue.min,
                currentValue.max,
                { from: owner }
            );

            try {
                // Invocation
                const updateWithTimelockResult = await instance.updatePlatformSettingWithTimelock(
                    settingsKeyBytes32,
                    newValue,
                    { from: sender }
                );
                const applyTimelockResult = await instance.applyPlatformSettingTimelock(
                  settingsKeyBytes32,
                  { from: sender }
                );

                // Assertions
                settings
                  .platformSettingUpdateWithTimelock(updateWithTimelockResult)
                  .emitted(
                    settingsKeyBytes32,
                    sender,
                    newValue
                  );
                settings
                    .platformSettingUpdated(applyTimelockResult)
                    .emitted(
                        settingsKeyBytes32,
                        sender,
                        currentValue.value,
                        newValue
                    );

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
