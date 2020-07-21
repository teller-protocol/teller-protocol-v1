// Smart contracts

// Util classes
const { ganache: readParams } = require("../utils/cli-builder");
const Timer = require('../utils/Timer');
const ProcessArgs = require('../utils/ProcessArgs');
const { SECONDS } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.advanceTime().argv);

module.exports = async (callback) => {
    try {
        const seconds = processArgs.getValue(SECONDS.name);
        const timer = new Timer(web3);
        
        const nextTimestamp_1 = await timer.getCurrentTimestampInSecondsAndSum(seconds);
        console.log(`Advancing local blockchain time: (Current: ${(await timer.getCurrentDate())})...`);
        await timer.advanceBlockAtTime(nextTimestamp_1);

        const currentDate = await timer.getCurrentDate();
        console.log(`Current blockchain date: ${currentDate}.`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};