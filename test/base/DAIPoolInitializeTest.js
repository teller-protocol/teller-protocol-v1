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
    let loanInfoInstance;
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await Mock.new();
        assert(zdaiInstance);
        assert(zdaiInstance.address);

        daiInstance = await Mock.new();
        assert(daiInstance);
        assert(daiInstance.address);

        lenderInfoInstance = await Mock.new();
        assert(lenderInfoInstance);
        assert(lenderInfoInstance.address);

        loanInfoInstance = await Mock.new();
        assert(loanInfoInstance);
        assert(loanInfoInstance.address);
    });

    withData({
        _1_basic: [true, true, true, true, undefined, false],
        _2_notZdai: [false, true, true, true, 'ZDai address is required.', true],
        _3_notDai: [true, false, true, true, 'DAI address is required.', true],
        _4_notLenderInfo: [true, true, false, true, 'LenderInfo address is required.', true],
        _5_notLoanInfo: [true, true, true, false, 'LoanInfo address is required.', true],
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
            const loanInfoAddress = createLoanInfo ? loanInfoInstance.address : NULL_ADDRESS;

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