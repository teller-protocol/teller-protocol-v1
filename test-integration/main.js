// Util classes
const index = require('./index');
const Timer = require('../scripts/utils/Timer');
const ProcessArgs = require('../scripts/utils/ProcessArgs');
const Accounts = require('../scripts/utils/Accounts');

const processArgs = new ProcessArgs();
const tests = Object.keys(index).map( key => index[key]);

module.exports = async (callback) => {
    const timer = new Timer(web3);
    const accounts = new Accounts(web3);
    let snapshotId;
    try {
        const getContracts = processArgs.createGetContracts(artifacts);

        snapshotId = await timer.takeSnapshot();
        const testContext = {
            processArgs,
            getContracts,
            timer,
            accounts,
        };
        const executeTestFunction = async (testFunctionObject) => {
            console.time(testFunctionObject.key);
            console.log(`>>>>> Test: ${testFunctionObject.key} starts <<<<<`);
            await testFunctionObject.test(testContext);
            console.timeEnd(testFunctionObject.key);
            console.timeLog(testFunctionObject.key)
            console.log(`>>>>> Test: ${testFunctionObject.key} ends <<<<<`);
        };

        for (const testKey in tests) {
            let test = tests[testKey];
            const testType = typeof test;
            if(testType === 'object') {
                const testObjects = Object.keys(test).map( key => ({test: test[key], key }));
                for (const testObject of testObjects) {
                    try {
                        await executeTestFunction(testObject);
                    } catch (error) {
                        console.log(error);
                    } finally {
                        await timer.revertToSnapshot(snapshotId.result);
                    }
                }
            }
        }
        
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        await timer.revertToSnapshot(snapshotId);
        console.log(error);
        callback(error);
    }
};
