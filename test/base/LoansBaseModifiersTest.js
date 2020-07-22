// JS Libraries
const withData = require('leche').withData;
const { t, NON_EXISTENT, ACTIVE, TERMS_SET, CLOSED, NULL_ADDRESS } = require('../utils/consts');

// Mock constracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LoansBaseModifiersMock = artifacts.require("./mock/base/LoansBaseModifiersMock.sol");

const initializeLoans = async (instance, { priceOracle, lendingPool, loanTermsConsensus, settings }) => {
    await instance.initialize(
        priceOracle.address,
        lendingPool.address,
        loanTermsConsensus.address,
        settings.address,
    );
};

contract('LoansBaseModifiersTest', function (accounts) {
    let instance
    
    beforeEach('Setup for each test', async () => {
      instance = await LoansBaseModifiersMock.new();
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
            const priceOracle = await Mock.new();
            const lendingPool = await Mock.new();
            const loanTermsConsensus = await Mock.new();
            const settings = await Mock.new();
            await initializeLoans(instance, { lendingPool, priceOracle, loanTermsConsensus, settings });
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
            const priceOracle = await Mock.new();
            const lendingPool = await Mock.new();
            const loanTermsConsensus = await Mock.new();
            const settings = await Mock.new();
            await initializeLoans(instance, { lendingPool, priceOracle, loanTermsConsensus, settings });
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
            const priceOracle = await Mock.new();
            const lendingPool = await Mock.new();
            const loanTermsConsensus = await Mock.new();
            const settings = await Mock.new();
            await initializeLoans(instance, { lendingPool, priceOracle, loanTermsConsensus, settings });
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
        _1_basic: [0, 0, undefined, false],
        _2_not_borrower: [1, 0, 'BORROWER_MUST_BE_SENDER', true],
    }, function(
        borrowerIndex,
        senderIndex,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'isBorrower', 'Should able (or not) to call function with modifier isBorrower.', mustFail), async function() {
            // Setup
            const priceOracle = await Mock.new();
            const lendingPool = await Mock.new();
            const loanTermsConsensus = await Mock.new();
            const settings = await Mock.new();
            await initializeLoans(instance, { lendingPool, priceOracle, loanTermsConsensus, settings });
            const borrowerAddress = borrowerIndex === -1 ? NULL_ADDRESS : accounts[borrowerIndex];
            const senderAddress = senderIndex === -1 ? NULL_ADDRESS : accounts[senderIndex];

            try {
                // Invocation
                let result = await instance.externalIsBorrower(borrowerAddress, { from: senderAddress });

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
