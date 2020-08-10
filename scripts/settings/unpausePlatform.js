// Smart contracts

// Util classes
const Accounts = require('../utils/Accounts');
const { zerocollateral } = require("../utils/contracts");
const { settings: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const { SENDER_INDEX } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.unpausePlatform().argv);

/** Process parameters: */

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const getContracts = processArgs.createGetContracts(artifacts);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);

        const settings = await getContracts.getDeployed(zerocollateral.settings());

        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);

        const currentPaused = await settings.isPaused();
        console.log(`Paused:   ${currentPaused.toString()}`);

        const result = await settings.unpause(senderTxConfig);
        console.log(toTxUrl(result));

        const updatedPaused = await settings.isPaused();
        console.log(`Updated Paused:   ${updatedPaused.toString()}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};