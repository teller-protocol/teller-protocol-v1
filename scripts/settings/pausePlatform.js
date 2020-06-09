// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const senderIndex = 0;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../../config')(network);
        const { zerocollateral, toTxUrl } = appConf.networkConfig;

        const settingsAddress = zerocollateral.Settings;
        assert(settingsAddress, "Settings address is undefined.");

        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const sender = accounts[senderIndex];
        assert(sender, "Sender must be defined.");

        const txConfig = { from: sender };

        const settings = await Settings.at(settingsAddress);

        const currentPaused = await settings.isPaused(txConfig);
        console.log(`Paused:   ${currentPaused.toString()}`);

        const result = await settings.pause(txConfig);
        console.log(toTxUrl(result));

        const updatedPaused = await settings.isPaused(txConfig);
        console.log(`Updated Paused:   ${updatedPaused.toString()}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};