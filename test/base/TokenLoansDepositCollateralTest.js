// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, ACTIVE } = require('../utils/consts');
const { createLoanTerms } = require('../utils/structs');
const Timer = require('../../scripts/utils/Timer');

const { loans } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const LINKMock = artifacts.require("./mock/token/LINKMock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/TokenLoansMock.sol");

contract('TokenLoansDepositCollateralTest', function (accounts) {
    const timer = new Timer(web3);
    const collateralTokenOwner = accounts[9];
    let collateralToken;
    let instance;
    
    beforeEach('Setup for each test', async () => {
        collateralToken = await LINKMock.new({ from: collateralTokenOwner });
        const lendingPoolInstance = await Mock.new();
        const oracleInstance = await Mock.new();
        const loanTermsConsInstance = await Mock.new();
        const settingsInstance = await Mock.new()
        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            collateralToken.address,
        )
    });

    withData({
        _1_deposit_basic: [
            1, 1, accounts[1], accounts[1], accounts[1], 5000000, 5000000, 5000000, 0, false, undefined
        ],
        _2_borrower_loan_mismatch: [
            2, 2, accounts[2], accounts[2], accounts[3], 6000000, 6000000, 6000000, 0, true, 'BORROWER_LOAN_ID_MISMATCH'
        ],
        _3_deposit_zero: [
            3, 3, accounts[3], accounts[3], accounts[3], 0, 0, 0, 0, true, 'CANNOT_DEPOSIT_ZERO'
        ],
        _4_deposit_more: [
            4, 4, accounts[4], accounts[4], accounts[4], 5000000, 5000000, 5000000, 5000000, false, undefined
        ],
    }, function(
        lastLoanID,
        currentLoanID,
        sender,
        loanBorrower,
        specifiedBorrower,
        currentCollateralTokenBalance,
        approveCollateralAmount,
        collateralAmount,
        currentCollateral,
        mustFail,
        expectedErrorMessage
    ) {
        it(t('user', 'depositCollateral', 'Should able (or not) to deposit tokens as collateral.', false), async function() {
            // Setup
            const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, 0, 0, 0)
            await instance.setLoan(lastLoanID, loanTerms, 0, 0, currentCollateral, 0, 0, 0, loanTerms.maxLoanAmount, ACTIVE, false)

            try {
                await collateralToken.mintTo(sender, currentCollateralTokenBalance, { from: collateralTokenOwner });
                const initialContractCollateralTokenBalance = await collateralToken.balanceOf(instance.address);
                const initialSenderCollateralTokenBalance = await collateralToken.balanceOf(sender);
                const initialTotalCollateral = await instance.totalCollateral();
                await collateralToken.approve(instance.address, approveCollateralAmount, { from: sender });

                // Invocation
                const result = await instance.depositCollateral(specifiedBorrower, currentLoanID, collateralAmount, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                loans
                    .collateralDeposited(result)
                    .emitted(currentLoanID, loanBorrower, collateralAmount)

                const finalTotalCollateral = await instance.totalCollateral()
                const finalContractCollateralTokenBalance = await collateralToken.balanceOf(instance.address)
                const finalSenderCollateralTokenBalance = await collateralToken.balanceOf(sender);

                const loanInfo = await instance.loans(currentLoanID);
                assert.equal(parseInt(loanInfo.collateral), (currentCollateral + collateralAmount));
                assert.equal(parseInt(initialTotalCollateral) + collateralAmount, parseInt(finalTotalCollateral));
                assert.equal(parseInt(initialContractCollateralTokenBalance) + collateralAmount, parseInt(finalContractCollateralTokenBalance));
                assert.equal(parseInt(initialSenderCollateralTokenBalance), parseInt(finalSenderCollateralTokenBalance) + collateralAmount);

                const txTimestamp = await timer.getCurrentTimestamp();
                assert.equal(parseInt(loanInfo.lastCollateralIn), txTimestamp);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});