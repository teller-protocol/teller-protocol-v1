// JS Libraries
const withData = require('leche').withData;
const { t, NON_EXISTENT, ACTIVE, TERMS_SET, CLOSED } = require('../utils/consts');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LoansBaseModifiersMock = artifacts.require("./mock/base/LoansBaseModifiersMock.sol");

contract('LoansBaseModifiersTest', function (accounts) {
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let instance;
    let settingsInstance;
    
    beforeEach('Setup for each test', async () => {
        const lendingPoolInstance = await Mock.new();
        const oracleInstance = await Mock.new();
        const loanTermsConsInstance = await Mock.new();
        settingsInstance = await Mock.new()
        instance = await LoansBaseModifiersMock.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address
        )
    });

    withData({
        _1_loanNonExistent: [NON_EXISTENT, 'LOAN_NOT_ACTIVE', true],
        _2_loanTermsSet: [TERMS_SET, 'LOAN_NOT_ACTIVE', true],
        _3_loanActive: [ACTIVE, undefined, false],
        _4_loanClosed: [CLOSED, 'LOAN_NOT_ACTIVE', true],
    }, function(
        loanStatus,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'loanActive(loanID)', 'Should able (or not) to call function with modifier loanActive.', mustFail), async function() {
            // Setup
            const loanID = 5
            await instance.setLoanStatus(loanID, loanStatus)

            try {
                // Invocation
                let result = await instance.externalLoanActive(loanID);

                // Assertions
                assert(!mustFail, 'It should have failed because loan is not active');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_loanNonExistent: [0, 'LOAN_NOT_SET', true],
        _2_loanTermsSet: [1, undefined, false],
        _3_loanActive: [2, 'LOAN_NOT_SET', true],
        _4_loanClosed: [3, 'LOAN_NOT_SET', true],
    }, function(
        loanStatus,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'loanTermsSet(loanID)', 'Should able (or not) to call function with modifier loanActive.', mustFail), async function() {
            // Setup
            const loanID = 5
            await instance.setLoanStatus(loanID, loanStatus)

            try {
                // Invocation
                let result = await instance.externalLoanTermsSet(loanID);

                // Assertions
                assert(!mustFail, 'It should have failed because loan is not active');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_loanNonExistent: [0, 'LOAN_NOT_ACTIVE_OR_SET', true],
        _2_loanTermsSet: [1, undefined, false],
        _3_loanActive: [2, undefined, false],
        _4_loanClosed: [3, 'LOAN_NOT_ACTIVE_OR_SET', true],
    }, function(
        loanStatus,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'loanActiveOrSet(loanID)', 'Should able (or not) to call function with modifier loanActive.', mustFail), async function() {
            // Setup
            const loanID = 5
            await instance.setLoanStatus(loanID, loanStatus)

            try {
                // Invocation
                let result = await instance.externalLoanActiveOrSet(loanID);

                // Assertions
                assert(!mustFail, 'It should have failed because loan is not active');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_exceeds: [0, true, 'AMOUNT_EXCEEDS_MAX_AMOUNT', true],
        _2_not_exceeds: [0, false, undefined, false],
    }, function(
        amount,
        exceedsMaxLendingAmount,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'notExceedsMaxAmount', 'Should able (or not) to test whether amount exceeds the max amount or not.', mustFail), async function() {
            // Setup
            const encodeExceedsMaxLendingAmount = settingsInterfaceEncoder.encodeExceedsMaxLendingAmount();
            await settingsInstance.givenMethodReturnBool(encodeExceedsMaxLendingAmount, exceedsMaxLendingAmount);

            try {
                // Invocation
                const result = await instance.externalNotExceedsMaxAmount(amount);

                // Assertions
                assert(!mustFail, 'It should have failed because amount exceeds max');
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
