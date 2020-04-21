// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");

contract('LendersConstructorTest', function (accounts) {
    let zTokenInstance;
    let lendingPoolInstance;
    let interestConsensusInstance;

    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        lendingPoolInstance = await Mock.new();
        interestConsensusInstance = await Mock.new();
    });

    withData({
        _1_basic: [true, true, true, undefined, false],
        _2_notzTokenInstance: [false, true, true, 'zToken address is required.', true],
        _3_notLendingPoolInstance: [true, false, true, 'LendingPool address is required.', true],
        _4_notConsensusInstance: [true, true, false, 'Consensus address is required.', true],
        _5_notzTokenInstance_notLendingPoolInstance: [false, false, true, 'zToken address is required.', true],
    }, function(
        createzTokenInstance,
        createLendingPoolInstance,
        createConsensusInstance,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            const zTokenAddress = createzTokenInstance ? zTokenInstance.address : NULL_ADDRESS;
            const lendingPoolAddress = createLendingPoolInstance ? lendingPoolInstance.address : NULL_ADDRESS;
            const consensusAddress = createConsensusInstance ? interestConsensusInstance.address : NULL_ADDRESS;

            try {
                // Invocation
                const result = await Lenders.new(
                    zTokenAddress,
                    lendingPoolAddress,
                    consensusAddress,
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                assert(result.address);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});