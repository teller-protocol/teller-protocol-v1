// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");

contract('LendersInitializeTest', function (accounts) {
    let zTokenInstance;
    let lendingPoolInstance;
    let interestConsensusInstance;
    let settingsInstance;
    let instance;

    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        lendingPoolInstance = await Mock.new();
        interestConsensusInstance = await Mock.new();
        settingsInstance = await Mock.new();
        instance = await Lenders.new();
    });

    withData({
        _1_basic: [true, true, true, true, undefined, false],
        _2_notzTokenInstance: [false, true, true, true, 'ZTOKEN_MUST_BE_PROVIDED', true],
        _3_notLendingPoolInstance: [true, false, true, true, 'LENDING_POOL_MUST_BE_PROVIDED', true],
        _4_notConsensusInstance: [true, true, false, true, 'CONSENSUS_MUST_BE_PROVIDED', true],
        _5_notzTokenInstance_notLendingPoolInstance: [false, false, true, true, 'ZTOKEN_MUST_BE_PROVIDED', true],
        _6_notSettingsInstance: [true, true, true, false, 'SETTINGS_MUST_BE_PROVIDED', true],
    }, function(
        createzTokenInstance,
        createLendingPoolInstance,
        createConsensusInstance,
        createSettingsInstance,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            const zTokenAddress = createzTokenInstance ? zTokenInstance.address : NULL_ADDRESS;
            const lendingPoolAddress = createLendingPoolInstance ? lendingPoolInstance.address : NULL_ADDRESS;
            const consensusAddress = createConsensusInstance ? interestConsensusInstance.address : NULL_ADDRESS;
            const settingsAddress = createSettingsInstance ? settingsInstance.address : NULL_ADDRESS;

            try {
                // Invocation
                const result = await instance.initialize(
                    zTokenAddress,
                    lendingPoolAddress,
                    consensusAddress,
                    settingsAddress,
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});