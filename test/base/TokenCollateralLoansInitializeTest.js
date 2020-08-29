// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/TokenCollateralLoansMock.sol");

contract('TokenCollateralLoansInitializeTest', function (accounts) {
    let mocks;
    
    beforeEach('Setup for each test', async () => {
        mocks = await createMocks(Mock, 20);
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [2, 3, 4, 5, 6, 7, undefined, false],
        _2_not_oracle: [-1, 3, 4, 5, 6, 7, 'PROVIDE_ORACLE_ADDRESS', true],
        _3_not_lendingpool: [2, -1, 4, 5, 6, 7, 'PROVIDE_LENDING_POOL_ADDRESS', true],
        _4_not_loanTerms: [2, 3, -1, 5, 6, 7, 'PROVIDED_LOAN_TERMS_ADDRESS', true],
        _5_not_settings: [2, 3, 4, -1, 6, 7, 'SETTINGS_MUST_BE_PROVIDED', true],
        _6_not_collateralToken: [2, 3, 4, 5, -1, 7, 'PROVIDE_COLL_TOKEN_ADDRESS', true],
        _7_not_atm_settings: [2, 3, 4, 5, 6, -1, 'PROVIDED_ATM_SETTINGS_ADDRESS', true],
    }, function(
        priceOracleIndex,
        lendingPoolIndex,
        loanTermsConsensusIndex,
        settingsIndex,
        collateralTokenIndex,
        atmSettingsIndex,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'initialize', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            const loansInstance = await Loans.new();
            const priceOracleAddress = getInstance(mocks, priceOracleIndex, 2);
            const lendingPoolAddress = getInstance(mocks, lendingPoolIndex, 3);
            const loanTermsConsensusAddress = getInstance(mocks, loanTermsConsensusIndex, 4);
            const settingsAddress = getInstance(mocks, settingsIndex, 5);
            const collateralTokenAddress = getInstance(mocks, collateralTokenIndex, 6);
            const atmSettingsAddress = getInstance(mocks, atmSettingsIndex, 8);

            try {
                // Invocation
                const result = await loansInstance.initialize(
                    priceOracleAddress,
                    lendingPoolAddress,
                    loanTermsConsensusAddress,
                    settingsAddress,
                    collateralTokenAddress,
                    atmSettingsAddress,
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