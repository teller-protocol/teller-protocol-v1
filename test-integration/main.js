// Util classes
const { ganacheTest: readParams } = require('../scripts/utils/cli-builder');
const scenarios = require('./scenarios');
const Timer = require('../scripts/utils/Timer');
const ProcessArgs = require('../scripts/utils/ProcessArgs');
const Accounts = require('../scripts/utils/Accounts');
const Nonces = require('../scripts/utils/Nonces');
const { printSeparatorLine } = require('../test/utils/consts');
const executeInitializers = require('./initializers');
const chains = require('../test/utils/chains');

const processArgs = new ProcessArgs(readParams().argv);
const tests = Object.keys(scenarios).map( key => scenarios[key]);

const executeTestFunction = async (testFunctionObject, testContext) => {
    console.time(testFunctionObject.key);
    console.group(`>>>>> Test: ${testFunctionObject.key} starts <<<<<`);
    await testFunctionObject.test(testContext);
    console.timeEnd(testFunctionObject.key);
    console.timeLog(testFunctionObject.key)
    console.groupEnd(`>>>>> Test: ${testFunctionObject.key} ends <<<<<`);
};

module.exports = async (callback) => {
    const network = processArgs.getValue('network');
    const revertBlockchain = processArgs.getValue('revert', false);
    const initialNonceValue = processArgs.getValue('initialNonce', 0);
    const testResults = new Map();
    const timer = new Timer(web3);
    const accounts = new Accounts(web3);
    const nonces = new Nonces(initialNonceValue);
    let snapshotId;
    try {
        const getContracts = processArgs.createGetContracts(artifacts);
        
        snapshotId = await timer.takeSnapshot();
        const testContext = {
            artifacts,
            network,
            processArgs,
            getContracts,
            timer,
            accounts,
            web3,
            nonces,
            chainId: chains.localGanache,
        };

        await executeInitializers(
            processArgs.createInitializersConfig(),
            { processArgs, getContracts, accounts, web3 },
        );

        for (const testKey in tests) {
            let test = tests[testKey];
            const testType = typeof test;
            if(testType === 'object') {
                const testObjects = Object.keys(test).map( key => ({test: test[key], key }));
                for (const testObject of testObjects) {
                    try {
                        printSeparatorLine();
                        await executeTestFunction(testObject, testContext);
                        printSeparatorLine();
                    } catch (error) {
                        console.log(error);
                        testResults.set(testObject.key, error);
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
        callback(error);
    } finally {
        console.log(`Revert blockchain to initial snapshot (--revert false|true cli param or default -true-)? ${revertBlockchain}`);
        if(revertBlockchain.toString() === 'true') {
            await timer.revertToSnapshot(snapshotId.result);
        }
    }
    console.log();
    if(testResults.size === 0) {
        console.log('Test Results: >>>> The integration tests finished successfully. <<<<');
        callback();
    } else {
        console.group('Test Results: >>>> Some integration tests failed. <<<<');
        testResults.forEach( (error, key) => {
            console.group(`- ${key}`);
            console.log(error);
            console.groupEnd();
            console.log();
        });
        console.groupEnd();
        callback('>>>> Some integration tests failed. <<<<');
    }
};
