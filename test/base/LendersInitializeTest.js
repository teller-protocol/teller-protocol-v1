// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");

contract('LendersInitializeTest', function (accounts) {
    let instance;
    let mocks;

    beforeEach('Setup for each test', async () => {
        mocks = await createMocks(Mock, 10);
        instance = await Lenders.new();
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [2, 3, 4, 5, 6, undefined, false],
        _2_notTTokenInstance: [-1, 3, 4, 5, 6, 'TTOKEN_MUST_BE_PROVIDED', true],
        _3_notLendingPoolInstance: [2, -1, 4, 5, 6, 'LENDING_POOL_MUST_BE_PROVIDED', true],
        _4_notConsensusInstance: [2, 3, -1, 5, 6, 'CONSENSUS_MUST_BE_PROVIDED', true],
        _5_notTTokenInstance_notLendingPoolInstance: [-1, 3, -1, 5, 6, 'TTOKEN_MUST_BE_PROVIDED', true],
        _6_notSettingsInstance: [2, 3, 4, -1, 6, 'SETTINGS_MUST_BE_PROVIDED', true],
        _7_notMarkets: [2, 3, 4, 5, -1, 'MARKETS_MUST_BE_PROVIDED', true],
        _8_notMarkets_not_contract: [2, 3, 4, 5, 99, 'MARKETS_MUST_BE_A_CONTRACT', true],
    }, function(
        tokenIndex,
        lendingPoolIndex,
        consensusIndex,
        settingsIndex,
        marketsIndex,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            const tTokenAddress = getInstance(mocks, tokenIndex, 2);
            const lendingPoolAddress = getInstance(mocks, lendingPoolIndex, 3);
            const consensusAddress = getInstance(mocks, consensusIndex, 4);
            const settingsAddress = getInstance(mocks, settingsIndex, 5);
            const marketsAddress = getInstance(mocks, marketsIndex, 6);

            try {
                // Invocation
                const result = await instance.initialize(
                    tTokenAddress,
                    lendingPoolAddress,
                    consensusAddress,
                    settingsAddress,
                    marketsAddress,
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