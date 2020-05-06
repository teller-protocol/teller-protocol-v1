// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Smart contracts
const LoansModifiersMock = artifacts.require("./mock/base/LoansModifiersMock.sol");

contract('LoansModifiersTest', function (accounts) {
    let instance
    
    beforeEach('Setup for each test', async () => {
      instance = await LoansModifiersMock.new(accounts[1], accounts[2], accounts[3], 5000);
    });

    withData({
        _1_loanNonExistent: [0, 'LOAN_NOT_ACTIVE', true],
        _2_loanTermsSet: [1, 'LOAN_NOT_ACTIVE', true],
        _3_loanActive: [2, undefined, false],
        _4_loanClosed: [3, 'LOAN_NOT_ACTIVE', true],
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
});
