const TEST_SETTINGS_VALUES = require('../../config/networks/test/platformSettings');
const {
    daysToSeconds,
} = require('./consts');
const initPlatformSettings = require('../../migrations/utils/init_settings/initPlatformSettings');

const AdminUpgradeabilityProxy = artifacts.require("./base/UpgradeableProxy.sol");

const INITIAL_VALUE = 1;
const TEST_DEFAULT_VALUE = {
    requiredSubmissions: INITIAL_VALUE,
    maximumTolerance: INITIAL_VALUE,
    responseExpiryLength: INITIAL_VALUE,
    safetyInterval: INITIAL_VALUE,
    termsExpiryTime: INITIAL_VALUE,
    liquidateEthPrice: INITIAL_VALUE,
    maximumLoanDuration: daysToSeconds(30),
    startingBlockNumber: INITIAL_VALUE,
    collateralBuffer: INITIAL_VALUE,
};

const createSettingsInstance = async (
    Settings,
    params,
) => {
    const { from } = Settings.class_defaults
    const settingsInstance = await Settings.new();
    const proxy = await AdminUpgradeabilityProxy.new(settingsInstance.address, from, '0x')
    const instance = await Settings.at(proxy.address)
    await instance.initialize(from)

    const shouldInitPlatformSettings = typeof params === 'object'
    if (shouldInitPlatformSettings) {
        await initPlatformSettings(
            instance,
            params,
            {},
        );
    }

    return instance;
};

const overrideDefaultTestValues = (params) => {
    const testSettingValuesArray = Object.entries(TEST_SETTINGS_VALUES);
    const values = { };
    for (const [settingsName, settingsValue] of testSettingValuesArray) {
        values[settingsName] = settingsValue;
        if (params !== undefined && params[settingsName] !== undefined) {
            values[settingsName].value = params[settingsName];
        }
    }
    return values;
};

module.exports = {
    TEST_DEFAULT_VALUE,
    // NOTE: Pass an object as `params` to init platform settings
    createTestSettingsInstance: async (Settings, params) => {
        // It overrides the TEST default values using a {settingName: newValue} object.
        // See examples using this 'createTestSettingsInstance' function.
        if (typeof params === 'object') {
            const values = overrideDefaultTestValues(params);
            params = { platformSettings: values, currentBlockNumber: 0, web3, verbose: false, }
        }

        return await createSettingsInstance(Settings, params);
    },
    printPlatformSetting: ({value, min, max, exists}, { settingName, settingNameBytes32 }) => {
        console.log(`Setting Name / Bytes32:    ${settingName} / ${settingNameBytes32}`);
        console.log(`Exists?:           ${exists.toString()}`);
        console.log(`Current Value:     ${value.toString()}`);
        console.log(`Min:               ${min.toString()}`);
        console.log(`Max:               ${max.toString()}`);
    },
};