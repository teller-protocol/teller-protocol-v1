// Util classes
const { ganacheTest: readParams } = require('../scripts/utils/cli-builder');
const scenarios = require('./scenarios');
const Timer = require('../scripts/utils/Timer');
const ProcessArgs = require('../scripts/utils/ProcessArgs');
const Accounts = require('../scripts/utils/Accounts');
const Nonces = require('../scripts/utils/Nonces');
const Swapper = require('./utils/Swapper')
const { printSeparatorLine } = require('../test/utils/consts');
const executeInitializers = require('./initializers');
const chains = require('../test/utils/chains');
const { REVERT, NETWORK, REVERT_TEST, INITIAL_NONCE, TOKEN_NAMES, COLL_TOKEN_NAMES, VERBOSE } = require('../scripts/utils/cli/names');

const UniswapSwapper = artifacts.require('./mock/providers/uniswap/Swapper.sol')

const processArgs = new ProcessArgs(readParams().argv);
const tests = Object.keys(scenarios).map( key => scenarios[key]);

const executeTestFunction = async (testFunctionObject, testContext) => {
    console.time(testFunctionObject.key);
    console.group(`>>>>> Test: ${testFunctionObject.key} starts <<<<<`);
    await testFunctionObject.test(testContext);
    console.timeEnd(testFunctionObject.key);
    console.timeLog(testFunctionObject.key)
    console.groupEnd();
    console.log(`>>>>> Test: ${testFunctionObject.key} ends <<<<<`);
};

module.exports = async (callback) => {
    global.web3 = web3

    const network = processArgs.getValue(NETWORK.name);
    const revertBlockchain = processArgs.getValue(REVERT.name, false);
    const revertTestBlockchain = processArgs.getValue(REVERT_TEST.name, false);
    const initialNonceValue = processArgs.getValue(INITIAL_NONCE.name, 0);
    const verbose = processArgs.getValue(VERBOSE.name, false);

    const tokenNames = processArgs.getValue(TOKEN_NAMES.name, 0);
    const collTokenNames = processArgs.getValue(COLL_TOKEN_NAMES.name, 0);
    let totalTests = 0;
    const testResults = new Map();
    const timer = new Timer(web3);
    const accounts = new Accounts(web3);
    const nonces = new Nonces(initialNonceValue);
    let snapshotId;
    try {
        const getContracts = processArgs.createGetContracts(artifacts);
        
        snapshotId = await timer.takeSnapshot();

        const uniswapArtifact = await UniswapSwapper.new();
        const funderTxConfig = await accounts.getTxConfigAt(6);
        const swapper = await Swapper.init(web3, uniswapArtifact, funderTxConfig);

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
            swapper,
            verbose,
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
                totalTests += testObjects.length;
                for (const testObject of testObjects) {
                    try {
                        printSeparatorLine();
                        let testSnapshotId;
                        if(revertTestBlockchain) {
                            testSnapshotId = await timer.takeSnapshot();
                        }
                        for (const tokenName of tokenNames) {
                            for (const collTokenName of collTokenNames) {
                                console.log(`\n\nExecuting integration test for market: ${tokenName} / ${collTokenName}.\n\n`)
                                await executeTestFunction(
                                    testObject,
                                    {...testContext, tokenName, collTokenName},
                                );
                            }
                        }
                        if(revertTestBlockchain) {
                            await timer.revertToSnapshot(testSnapshotId.result);
                        }
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
        const totalMarkets = tokenNames.length * collTokenNames.length;
        const totalCategories = tests.length;
        console.log('Test Results: >>>> The integration tests finished successfully. <<<<');
        console.log(`Markets: ${totalMarkets}`);
        console.log(`Categories: ${totalCategories}`);
        console.log(`Integration Tests: ${totalTests}`);
        console.log(`Executions: ${totalTests * totalMarkets}`);
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
