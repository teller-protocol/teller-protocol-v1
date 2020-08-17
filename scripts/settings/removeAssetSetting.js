// Smart contracts

// Util classes
const Accounts = require('../utils/Accounts');
const { teller, tokens } = require("../utils/contracts");
const { settings: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const { SENDER_INDEX, TOKEN_NAME } = require('../utils/cli/names');
const { printAssetSettings } = require('../../test/utils/asset-settings-helper');
const processArgs = new ProcessArgs(readParams.removeAssetSetting().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const getContracts = processArgs.createGetContracts(artifacts);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const assetName = processArgs.getValue(TOKEN_NAME.name);

        const settings = await getContracts.getDeployed(teller.settings());
        const tokenInstance = await getContracts.getDeployed(tokens.get(assetName));
        const assetAddress = tokenInstance.address;

        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);

        const currentAssetSettingResult = await settings.getAssetSettings(assetAddress);

        console.log(`Current Values:`);
        printAssetSettings(currentAssetSettingResult, { assetName, assetAddress });

        const result = await settings.removeAssetSettings(assetAddress, senderTxConfig);
        console.log(toTxUrl(result));

        const updatedAssetSettingResult = await settings.getAssetSettings(assetAddress);
        
        console.log(`Updated Values (after removing):`);
        printAssetSettings(updatedAssetSettingResult, { assetName, assetAddress });

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};