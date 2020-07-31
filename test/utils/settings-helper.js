const getAppConfig = require('../../config');
const {
    daysToSeconds,
} = require('./consts');

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
    txConfig,
) => {
    console.log(params);
    const {
        requiredSubmissions,
        maximumTolerance,
        responseExpiryLength,
        safetyInterval,
        termsExpiryTime,
        liquidateEthPrice,
        maximumLoanDuration,
        startingBlockNumber,
        collateralBuffer,
    } = params;
    const instance = await Settings.new(
        requiredSubmissions,
        maximumTolerance,
        responseExpiryLength,
        safetyInterval,
        termsExpiryTime,
        liquidateEthPrice,
        maximumLoanDuration,
        startingBlockNumber,
        collateralBuffer,
        txConfig
    );
    return instance;
};

module.exports = {
    TEST_DEFAULT_VALUE,
    createSettingsInstance,
    createTestSettingsInstance: async (Settings, params) => {
        const values = {
            ...TEST_DEFAULT_VALUE,
            ...params,
        };
        const instance = await createSettingsInstance(Settings, values);
        return instance;
    },
    createEnvSettingsInstance: async (deployerApp, Settings, network, currentBlockNumber, txConfig) => {
        const { env } = getAppConfig(network);
        const settingsParams = env.createSettingsParams(currentBlockNumber);

        await deployerApp.deploy(
            Settings,
            settingsParams.requiredSubmissions,
            settingsParams.maximumTolerance,
            settingsParams.responseExpiryLength,
            settingsParams.safetyInterval,
            settingsParams.termsExpiryTime,
            settingsParams.liquidateEthPrice,
            settingsParams.maximumLoanDuration,
            settingsParams.startingBlockNumber,
            settingsParams.collateralBuffer,
            txConfig,
        );
        const settingsInstance = await Settings.deployed();
        return settingsInstance;
    },
};