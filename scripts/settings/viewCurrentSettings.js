// Smart contracts

// Util classes
const { zerocollateral } = require("../../scripts/utils/contracts");
const { settings: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs(readParams.view().argv);

module.exports = async (callback) => {
    try {
        const getContracts = processArgs.createGetContracts(artifacts);
        const settings = await getContracts.getDeployed(zerocollateral.settings());

        console.log('='.repeat(70));
        console.log(`Settings Address: ${settings.address}`);
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