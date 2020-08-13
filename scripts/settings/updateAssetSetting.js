// Smart contracts

// Util classes
const Accounts = require('../utils/Accounts');
const { zerocollateral, tokens } = require("../utils/contracts");
const { settings: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const { SENDER_INDEX, ASSET_SETTING_NAME, NEW_VALUE, TOKEN_NAME } = require('../utils/cli/names');
const { toBytes32 } = require('../../test/utils/consts');
const { printAssetSettings } = require('../../test/utils/asset-settings-helper');
const getAssetSettingsMap = require('../../test/utils/asset-settings-map');
const processArgs = new ProcessArgs(readParams.updateAssetSetting().argv);

module.exports = async (callback) => {
    try {
        const assetSettingsMap = getAssetSettingsMap();
        const accounts = new Accounts(web3);
        const getContracts = processArgs.createGetContracts(artifacts);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const assetSettingName = processArgs.getValue(ASSET_SETTING_NAME.name);
        const newValue = processArgs.getValue(NEW_VALUE.name);
        const assetName = processArgs.getValue(TOKEN_NAME.name);
        const assetSettingNameBytes32 = toBytes32(web3, assetSettingName);


        const settings = await getContracts.getDeployed(zerocollateral.settings());
        const tokenInstance = await getContracts.getDeployed(tokens.get(assetName));
        const assetAddress = tokenInstance.address;

        const assetSettingConfig = assetSettingsMap.get(assetSettingName);
        if(assetSettingConfig === undefined) {
            throw new Error(`Asset setting name ${assetSettingName} not found.`);
        }

        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);

        const currentAssetSettingResult = await settings.getAssetSettings(assetAddress);

        console.log(`Current Values:`);
        printAssetSettings(currentAssetSettingResult, { assetName, assetAddress, assetSettingName, assetSettingNameBytes32 });

        const { set: setAssetSettingValue, calculateNewValue } = assetSettingConfig;

        const processedNewValue = await calculateNewValue(
            { ...appConf.networkConfig },
            { newValue },
            { token: tokenInstance }
        );

        const result = await setAssetSettingValue(settings, assetAddress, processedNewValue, senderTxConfig);
        console.log(toTxUrl(result));

        const updatedAssetSettingResult = await settings.getAssetSettings(assetAddress);
        
        console.log(`Updated Values:`);
        printAssetSettings(updatedAssetSettingResult, { assetName, assetAddress, assetSettingName, assetSettingNameBytes32 });

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};