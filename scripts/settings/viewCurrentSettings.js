// Smart contracts
const SettingsInterface = artifacts.require("./interfaces/SettingsInterface.sol");

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
        const { zerocollateral } = appConf.networkConfig;

        const settingsAddress = zerocollateral.Settings;
        assert(settingsAddress, "Settings address is undefined.");

        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const sender = accounts[senderIndex];
        assert(sender, "Sender must be defined.");

        const settings = await SettingsInterface.at(settingsAddress);

        console.log('='.repeat(70));
        console.log(`Settings Address: ${settingsAddress}`);
        console.log('='.repeat(70));

        const currentRequiredSubmissions = await settings.requiredSubmissions();
        console.log(`Required Submissions:      ${currentRequiredSubmissions.toString()}`);

        const maximumTolerance = await settings.maximumTolerance();
        console.log(`Max. Tolerance:            ${maximumTolerance.toString()}`);

        const responseExpiryLength = await settings.responseExpiryLength();
        console.log(`Response Expiry Length:    ${responseExpiryLength.toString()}`);

        const safetyInterval = await settings.safetyInterval();
        console.log(`Safety Interval:           ${safetyInterval.toString()} (seconds) = ${parseInt(safetyInterval) / 60} (minutes)`);

        const termsExpiryTime = await settings.termsExpiryTime();
        console.log(`Terms Expiry Time:         ${termsExpiryTime.toString()} (seconds) = ${parseInt(termsExpiryTime) / 60} (minutes)`);

        const liquidateEthPrice = await settings.liquidateEthPrice();
        console.log(`Liquidate Ether Price (%): ${liquidateEthPrice.toString()} (two decimals)`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};