// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/TokenCollateralLoansMock.sol");

contract('TokenCollateralLoansInitializeTest', function (accounts) {
    let priceOracle;
    let lendingPool;
    let loanTermsConsensus;
    let settings;
    let collateralToken;
    
    beforeEach('Setup for each test', async () => {
        priceOracle = await Mock.new();
        lendingPool = await Mock.new();
        loanTermsConsensus = await Mock.new();
        settings = await Mock.new();
        collateralToken = await Mock.new();
    });

    withData({
        _1_basic: [true, true, true, true, true, undefined, false],
        _2_not_oracle: [false, true, true, true, true, 'PROVIDE_ORACLE_ADDRESS', true],
        _3_not_lendingpool: [true, false, true, true, true, 'PROVIDE_LENDINGPOOL_ADDRESS', true],
        _4_not_loanTerms: [true, true, false, true, true, 'PROVIDED_LOAN_TERMS_ADDRESS', true],
        _5_not_settings: [true, true, true, false, true, 'SETTINGS_MUST_BE_PROVIDED', true],
        _6_not_collateralToken: [true, true, true, true, false, 'PROVIDE_COLL_TOKEN_ADDRESS', true],
    }, function(
        createPriceOracle,
        createLendingPool,
        createLoanTermsConsensus,
        createSettings,
        createCollateralToken,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'initialize', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            const loansInstance = await Loans.new();
            const priceOracleAddress = createPriceOracle ? priceOracle.address : NULL_ADDRESS;
            const lendingPoolAddress = createLendingPool ? lendingPool.address : NULL_ADDRESS;
            const loanTermsConsensusAddress = createLoanTermsConsensus ? loanTermsConsensus.address : NULL_ADDRESS;
            const settingsAddress = createSettings ? settings.address : NULL_ADDRESS;
            const collateralTokenAddress = createCollateralToken ? collateralToken.address : NULL_ADDRESS;

            try {
                // Invocation
                const result = await loansInstance.initialize(
                    priceOracleAddress,
                    lendingPoolAddress,
                    loanTermsConsensusAddress,
                    settingsAddress,
                    collateralTokenAddress
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