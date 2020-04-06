// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const DAIPool = artifacts.require("./base/DAIPool.sol");

contract('DAIPoolInitializeTest', function (accounts) {
    let zdaiInstance;
    let daiInstance;
    let lenderInfoInstance;
    let loansInstance;
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await Mock.new();
        daiInstance = await Mock.new();
        lenderInfoInstance = await Mock.new();
        loansInstance = await Mock.new();
    });

    withData({
        _1_basic: [true, true, true, true, undefined, false],
        _2_notZdai: [false, true, true, true, 'ZDai address is required.', true],
        _3_notDai: [true, false, true, true, 'DAI address is required.', true],
        _4_notLenderInfo: [true, true, false, true, 'LenderInfo address is required.', true],
        _5_notLoanInfo: [true, true, true, false, 'Loans address is required.', true],
        _5_notZdai_notLoanInfo: [false, true, true, false, 'ZDai address is required.', true],
        _6_notDai_notLenderInfo: [true, false, false, true, 'DAI address is required.', true],
    }, function(
        createZdai,
        createDai,
        createLenderInfo,
        createLoanInfo,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'initialize', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            const daiPoolInstance = await DAIPool.new();
            const zDaiAddress = createZdai ? zdaiInstance.address : NULL_ADDRESS;
            const daiAddress = createDai ? daiInstance.address : NULL_ADDRESS;
            const lenderInfoAddress = createLenderInfo ? lenderInfoInstance.address : NULL_ADDRESS;
            const loanInfoAddress = createLoanInfo ? loansInstance.address : NULL_ADDRESS;

            try {
                // Invocation
                const result = await daiPoolInstance.initialize(
                    zDaiAddress,
                    daiAddress,
                    lenderInfoAddress,
                    loanInfoAddress,
                );;
                
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