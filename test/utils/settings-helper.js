const TEST_SETTINGS_VALUES = require('../../config/networks/test/platformSettings');
const {
    daysToSeconds,
} = require('./consts');
const initPlatformSettings = require('../../migrations/utils/init_settings/initPlatformSettings');

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
    { txConfig, Mock, initialize = false, onInitialize},
    platformSettings,
) => {
    const instance = await Settings.new();
    if(onInitialize !== undefined) {
        if(Mock !== undefined) {
            const escrowFactory = await Mock.new();
            const versionsRegistry = await Mock.new();
            const chainlinkAggregator = await Mock.new();
            const marketsState = await Mock.new();
            const interestValidator = await Mock.new();
            const atmSettings = await Mock.new();
            const weth = await Mock.new();
            const ceth = await Mock.new();
            if (initialize) {
                await instance.initialize(
                  escrowFactory.address,
                  versionsRegistry.address,
                  chainlinkAggregator.address,
                  marketsState.address,
                  interestValidator.address,
                  atmSettings.address,
                  weth.address,
                  ceth.address,
                );
            }
            await onInitialize(
                instance,
                {
                    escrowFactory,
                    versionsRegistry,
                    chainlinkAggregator,
                    marketsState,
                    interestValidator,
                    atmSettings,
                    weth,
                    ceth,
                }
            );
        } else {
            await onInitialize(instance, {});
        }
    } else {
        if(Mock !== undefined) {
            const escrowFactory = await Mock.new();
            const versionsRegistry = await Mock.new();
            const chainlinkAggregator = await Mock.new();
            const marketsState = await Mock.new();
            const interestValidator = await Mock.new();
            const atmSettings = await Mock.new();
            const weth = await Mock.new();
            const ceth = await Mock.new();
            await instance.initialize(
                escrowFactory.address,
                versionsRegistry.address,
                chainlinkAggregator.address,
                marketsState.address,
                interestValidator.address,
                atmSettings.address,
                weth.address,
                ceth.address,
            );
        }
    }

    const shouldInitPlatformSettings = typeof platformSettings === 'object'
    if (shouldInitPlatformSettings) {
        await initPlatformSettings(
            instance,
            { ...platformSettings, txConfig, },
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
    // NOTE: Pass an object as `platformSettings` to init platform settings
    createTestSettingsInstance: async (Settings, { from, Mock, initialize, onInitialize}, platformSettings) => {
        // It overrides the TEST default values using a {settingName: newValue} object.
        // See examples using this 'createTestSettingsInstance' function.
        if (typeof platformSettings === 'object') {
            const values = overrideDefaultTestValues(platformSettings);
            platformSettings = { platformSettings: values, currentBlockNumber: 0, web3, verbose: false, }
        }

        return await createSettingsInstance(Settings, { txConfig: { from }, Mock, initialize, onInitialize }, platformSettings);
    },
    printPlatformSetting: ({value, min, max, exists}, { settingName, settingNameBytes32 }) => {
        console.log(`Setting Name / Bytes32:    ${settingName} / ${settingNameBytes32}`);
        console.log(`Exists?:           ${exists.toString()}`);
        console.log(`Current Value:     ${value.toString()}`);
        console.log(`Min:               ${min.toString()}`);
        console.log(`Max:               ${max.toString()}`);
    },
};