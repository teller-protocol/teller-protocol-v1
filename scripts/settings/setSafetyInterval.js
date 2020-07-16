// Smart contracts
const SettingsInterface = artifacts.require("./interfaces/SettingsInterface.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const newSafetyInterval = 1 * 60; // 1 minute
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

        const settings = await SettingsInterface.at(settingsAddress);

        const currentSafetyInterval = await settings.safetyInterval(txConfig);
        console.log(`Current Safety Interval:   ${currentSafetyInterval.toString()}`);

        const result = await settings.setSafetyInterval(newSafetyInterval.toString(), txConfig);
        console.log(toTxUrl(result));

        const updatedSafetyInterval = await settings.safetyInterval(txConfig);
        console.log(`Updated Safety Interval:   ${updatedSafetyInterval.toString()}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};