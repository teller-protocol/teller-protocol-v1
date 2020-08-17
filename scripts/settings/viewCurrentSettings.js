// Smart contracts

// Util classes
const { teller } = require("../../scripts/utils/contracts");
const { settings: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const { printPlatformSetting } = require("../../test/utils/settings-helper");
const platformSettingsNames = require("../../test/utils/platformSettingsNames");
const { toBytes32 } = require("../../test/utils/consts");
const processArgs = new ProcessArgs(readParams.view().argv);

const callAndPrintPlatformSetting = async (settings, settingName, { web3 }) => {
    const settingNameBytes32 = toBytes32(web3, settingName);
    const platformSettingResult = await settings.getPlatformSetting(settingNameBytes32);
    
    printPlatformSetting(
        platformSettingResult,
        {
            settingName,
            settingNameBytes32,
        }
    );
};

module.exports = async (callback) => {
    try {
        const getContracts = processArgs.createGetContracts(artifacts);
        const settings = await getContracts.getDeployed(teller.settings());

        console.log('='.repeat(70));
        console.log(`Settings Address: ${settings.address}`);
        console.log('='.repeat(70));

        for (const [, settingName] of Object.entries(platformSettingsNames)) {
            console.log(settingName);
            await callAndPrintPlatformSetting(
                settings,
                settingName,
                { web3 }
            );
        }

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};