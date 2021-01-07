// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require('leche').withData;
const {
    t,
    toBytes32,
} = require('../utils/consts');
const { settings } = require('../utils/events');
const settingsNames = require('../utils/platformSettingsNames');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsRemovePlatformSettingTest', function (accounts) {
    const owner = accounts[0];
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await createTestSettingsInstance(Settings, { from: owner, Mock }, {
            [settingsNames.TimelockDuration]: 0
        });
    });

    const newSetting = (name, value, min = 0, max = value * 2) => ({name, nameBytes32: toBytes32(web3, name), value, min, max});

    withData({
        _1_valid: [
            [
                newSetting('customSetting', 1000, 0, 9000),
                newSetting('customSetting2', 2100, 0, 4000)
            ],
            0, 'customSetting2', undefined, false
        ],
        _2_invalid_not_exist: [
            [
                newSetting('customSettingA', 1000, 0, 9000),
                newSetting('customSettingB', 2100, 0, 4000)
            ],
            0, 'customSetting3', 'PLATFORM_SETTING_NOT_EXISTS', true
        ],
        _3_invalid_not_owner: [
            [
                newSetting('customSettingC', 1000, 0, 9000),
                newSetting('customSettingD', 2100, 0, 4000)
            ],
            1, 'customSettingD', 'NOT_PAUSER', true
        ],
    }, function(previousSettings, senderIndex, platformNameToRemove, expectedErrorMessage, mustFail) {
        it(t('user', `removePlatformSetting`, `Should (or not) be able to remove a platform setting.`, mustFail), async function() {
            // Setup
            const platformNameToRemoveBytes32 = toBytes32(web3, platformNameToRemove);
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
                const removeWithTimelockResult = await instance.removePlatformSettingWithTimelock(
                    platformNameToRemoveBytes32,
                    { from: sender }
                );
                const applyTimelockResult = await instance.applyPlatformSettingTimelock(
                  platformNameToRemoveBytes32,
                  { from: sender }
                );

                // Assertions
                const previousSetting = previousSettings.find( (item) => item.name === platformNameToRemove);

                settings
                  .platformSettingRemoveWithTimelock(removeWithTimelockResult)
                  .emitted(
                    platformNameToRemoveBytes32,
                    sender,
                  );
                settings
                    .platformSettingRemoved(applyTimelockResult)
                    .emitted(
                        platformNameToRemoveBytes32,
                        sender,
                        previousSetting.value,
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
