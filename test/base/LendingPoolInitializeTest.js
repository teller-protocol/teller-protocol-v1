// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('LendingPoolInitializeTest', function (accounts) {
    let mocks;

    beforeEach('Setup for each test', async () => {
        mocks = await createMocks(Mock, 20);
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [2, 3, 4, 5, 6, 7, 8, 9, undefined, false],
        _2_notZdai: [-1, 3, 4, 5, 6, 7, 8, 9, 'ZTOKEN_ADDRESS_IS_REQUIRED', true],
        _3_notDai: [2, -1, 4, 5, 6, 7, 8, 9, 'TOKEN_ADDRESS_IS_REQUIRED', true],
        _4_notLenderInfo: [2, 3, -1, 5, 6, 7, 8, 9, 'LENDERS_ADDRESS_IS_REQUIRED', true],
        _5_notLoanInfo: [2, 3, 4, -1, 6, 7, 8, 9, 'LOANS_ADDRESS_IS_REQUIRED', true],
        _6_notCToken: [2, 3, 4, 5, -1, 7, 8, 9, undefined, false],
        _7_notZdai_notLoanInfo: [-1, 3, 4, -1, 6, 7, 8, 9, 'ZTOKEN_ADDRESS_IS_REQUIRED', true],
        _8_notDai_notLenderInfo: [2, -1, -1, 5, 6, 7, 8, 9, 'TOKEN_ADDRESS_IS_REQUIRED', true],
        _9_notSettings: [2, 3, 4, 5, 6, -1, 8, 9, 'SETTINGS_MUST_BE_PROVIDED', true],
        _10_notMarkets: [2, 3, 4, 5, 6, 7, -1, 9, 'MARKETS_MUST_BE_PROVIDED', true],
        _11_notMarkets_not_contract: [2, 3, 4, 5, 6, 7, 99, 9, 'MARKETS_MUST_BE_A_CONTRACT', true],
        _12_notInterestValidator: [2, 3, 4, 5, 6, 7, 8, -1, undefined, false],
        _13_notInterestValidator_not_contract: [2, 3, 4, 5, 6, 7, 8, 99, 'VAL_MUST_BE_EMPTY_OR_CONTRACT', true],
        _14_notInterestValidator_not_contract_2: [2, 3, 4, 5, 6, 7, 8, 9, undefined, false],
    }, function(
        zdaiIndex,
        daiIndex,
        lenderInfoIndex,
        loanInfoIndex,
        cTokenIndex,
        settingsIndex,
        marketsIndex,
        interestValidatorIndex,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'initialize', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            const lendingPoolInstance = await LendingPool.new();
            const zTokenAddress = getInstance(mocks, zdaiIndex, 2);
            const daiAddress = getInstance(mocks, daiIndex, 3);
            const lendersAddress = getInstance(mocks, lenderInfoIndex, 4)
            const loanInfoAddress = getInstance(mocks, loanInfoIndex, 5)
            const cTokenAddress = getInstance(mocks, cTokenIndex, 6);
            const settingsAddress = getInstance(mocks, settingsIndex, 7);
            const marketsAddress = getInstance(mocks, marketsIndex, 7);
            const interestValidatorAddress = getInstance(mocks, interestValidatorIndex, 8);

            try {
                // Invocation
                const result = await lendingPoolInstance.initialize(
                    zTokenAddress,
                    daiAddress,
                    lendersAddress,
                    loanInfoAddress,
                    cTokenAddress,
                    settingsAddress,
                    marketsAddress,
                    interestValidatorAddress,
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