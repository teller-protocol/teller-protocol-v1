// Smart contracts

// Util classes
const { teller } = require("../../scripts/utils/contracts");
const { settings: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const { TOKEN_NAME } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.viewAsset().argv);

module.exports = async (callback) => {
    try {
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const assetAddress = processArgs.getCurrentConfig().networkConfig.tokens[tokenName]

        const getContracts = processArgs.createGetContracts(artifacts);
        const settings = await getContracts.getDeployed(teller.settings());

        console.log()
        console.log('='.repeat(70));
        console.log(`${tokenName} Settings: ${assetAddress}`);
        console.log('='.repeat(70));
        console.log()

        const assetSettingsResult = await settings.getAssetSettings.call(assetAddress);
        console.log(JSON.stringify(assetSettingsResult))

        console.log()

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};