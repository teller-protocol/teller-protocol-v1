// Smart contracts

// Util classes
const Accounts = require('../utils/Accounts');
const { zerocollateral } = require("../utils/contracts");
const { settings: readParams } = require("../utils/cli-builder");
const getSettingsMaps = require('../../test/utils/settings-map');
const ProcessArgs = require('../utils/ProcessArgs');
const { SENDER_INDEX, SETTING_NAME, NEW_VALUE } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.setNewSetting().argv);

module.exports = async (callback) => {
    try {
        const settingsMap = getSettingsMaps();
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