// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");

contract('LendersConstructorTest', function (accounts) {
    let zdaiInstance;
    let lendingPoolInstance;

    beforeEach('Setup for each test', async () => {
        zdaiInstance = await Mock.new();
        lendingPoolInstance = await Mock.new();
    });

    withData({
        _1_basic: [true, true, undefined, false],
        _2_notZdaiInstance: [false, true, 'ZDai address is required.', true],
        _3_notLendingPoolInstance: [true, false, 'LendingPool address is required', true],
        _4_notZdaiInstance_notLendingPoolInstance: [false, false, 'ZDai address is required.', true],
    }, function(
        createZdaiInstance,
        createLendingPoolInstance,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            const zDaiAddress = createZdaiInstance ? zdaiInstance.address : NULL_ADDRESS;
            const lendingPoolAddress = createLendingPoolInstance ? lendingPoolInstance.address : NULL_ADDRESS;

            try {
                // Invocation
                const result = await Lenders.new(
                    zDaiAddress,
                    lendingPoolAddress,
                );;
                
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