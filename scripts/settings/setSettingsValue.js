// Smart contracts

// Util classes
const Accounts = require('../utils/Accounts');
const { zerocollateral } = require("../utils/contracts");
const { settings: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const { SENDER_INDEX, SETTING_NAME, NEW_VALUE } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.setNewSetting().argv);

const settingsMap = new Map();
settingsMap.set(
    'requiredSubmissions',
    {
        get: async (settings) => (await settings.requiredSubmissions()),
        set: async (settings, newValue, senderTxConfig) => (await settings.setRequiredSubmissions(newValue.toString(), senderTxConfig)),
    }
);
settingsMap.set(
    'maximumTolerance',
    {
        get: async (settings) => (await settings.maximumTolerance()),
        set: async (settings, newValue, senderTxConfig) => (await settings.setMaximumTolerance(newValue.toString(), senderTxConfig)),
    }
);
settingsMap.set(
    'responseExpiryLength',
    {
        get: async (settings) => (await settings.responseExpiryLength()),
        set: async (settings, newValue, senderTxConfig) => (await settings.setResponseExpiryLength(newValue.toString(), senderTxConfig)),
    }
);
settingsMap.set(
    'safetyInterval',
    {
        get: async (settings) => (await settings.safetyInterval()),
        set: async (settings, newValue, senderTxConfig) => (await settings.setSafetyInterval(newValue.toString(), senderTxConfig)),
    }
);
settingsMap.set(
    'termsExpiryTime',
    {
        get: async (settings) => (await settings.termsExpiryTime()),
        set: async (settings, newValue, senderTxConfig) => (await settings.setTermsExpiryTime(newValue.toString(), senderTxConfig)),
    }
);
settingsMap.set(
    'liquidateEthPrice',
    {
        get: async (settings) => (await settings.liquidateEthPrice()),
        set: async (settings, newValue, senderTxConfig) => (await settings.setLiquidateEthPrice(newValue.toString(), senderTxConfig)),
    }
);


module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const getContracts = processArgs.createGetContracts(artifacts);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const settings = await getContracts.getDeployed(zerocollateral.settings());
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const settingName = processArgs.getValue(SETTING_NAME.name);
        const newValue = processArgs.getValue(NEW_VALUE.name);

        const settingMapValue = settingsMap.get(settingName);
        if(settingMapValue === undefined) {
            const keys =[ ...settingsMap.keys() ];
            const errorMessage = `Invalid setting name. Allowed values: ${keys}`;
            throw new Error(errorMessage);
        }

        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);

        const currentValue = await settingMapValue.get(settings, settingName);
        console.log(`Current Setting:   ${currentValue.toString()}`);

        const result = await settingMapValue.set(settings,  newValue, senderTxConfig);
        console.log(toTxUrl(result));

        const updatedValue = await settingMapValue.get(settings);
        console.log(`Updated Value:   ${updatedValue.toString()}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};