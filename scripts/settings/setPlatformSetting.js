// Smart contracts

// Util classes
const Accounts = require('../utils/Accounts');
const { zerocollateral } = require("../utils/contracts");
const { settings: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const { SENDER_INDEX, SETTING_NAME, NEW_VALUE } = require('../utils/cli/names');
const { toBytes32 } = require('../../test/utils/consts');
const { printPlatformSetting } = require('../../test/utils/settings-helper');
const processArgs = new ProcessArgs(readParams.setNewSetting().argv);

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
        const settingNameBytes32 = toBytes32(web3, settingName);

        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);

        const currentSettingResult = await settings.getPlatformSetting(settingNameBytes32);

        printPlatformSetting(currentSettingResult, { settingName, settingNameBytes32 });

        const result = await settings.updatePlatformSetting(settingNameBytes32, newValue, senderTxConfig);
        console.log(toTxUrl(result));

        const updatedSettingResult = await settings.getPlatformSetting(settingNameBytes32);
        console.log(`Updated Value:`);
        printPlatformSetting(updatedSettingResult, { settingName, settingNameBytes32 });

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};