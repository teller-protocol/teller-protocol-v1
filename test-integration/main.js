// Util classes
const assert = require('assert');
const index = require('./index');
const GetContracts = require('../scripts/utils/GetContracts');
const ProcessArgs = require('../scripts/utils/ProcessArgs');

const processArgs = new ProcessArgs();
const tests = Object.keys(index).map( key => index[key]);

module.exports = async (callback) => {
    const Timer = require('../scripts/utils/Timer');
    const timer = new Timer(web3);
    let snapshotId;
    try {
        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const appConf = processArgs.getCurrentConfig();
        const getContracts = new GetContracts(artifacts, appConf.networkConfig, 'zerocollateral');

        snapshotId = await timer.takeSnapshot();
        console.log(`Taking blockchain snapshot with id ${JSON.stringify(snapshotId)}`);
        const testContext = {
            processArgs,
            getContracts,
            timer,
            accounts,
        };
        const executeTestFunction = async (testFunction) => {
            await testFunction(testContext);
        };

        for (const test of tests) {
            const testType = typeof test;
            if(testType === 'object') {
                const testObjects = Object.keys(test).map( key => test[key]);
                for (const testObject of testObjects) {
                    executeTestFunction(testObject);
                }
            }
            if(testType === 'function') {
                executeTestFunction(testType);
            }
            await timer.revertToSnapshot(snapshotId);
            console.log(`Reverting blockchain state to snapshot id ${JSON.stringify(snapshotId)}`);
        }
        
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        await timer.revertToSnapshot(snapshotId);
        console.log(error);
        callback(error);
    }
};
