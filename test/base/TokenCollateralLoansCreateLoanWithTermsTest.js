// JS Libraries
const assert = require('assert');
const withData = require('leche').withData;
const {
  t,
  NULL_ADDRESS,
  TERMS_SET,
  THIRTY_DAYS,
  daysToSeconds
} = require('../utils/consts');
const { loans } = require('../utils/events');
const { createLoanRequest, createUnsignedLoanResponse } = require('../utils/structs');
const { assertLoan } = require('../utils/assertions');
const Timer = require('../../scripts/utils/Timer');
const LoanTermsConsensusEncoder = require('../utils/encoders/LoanTermsConsensusEncoder');
const LendingPoolInterfaceEncoder = require('../utils/encoders/LendingPoolInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const LINKMock = artifacts.require("./mock/token/LINKMock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/TokenCollateralLoansMock.sol");
const Settings = artifacts.require("./base/Settings.sol");
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");

const getAverage = (...values) => values !== undefined && values.length > 0 ?
                                values.reduce((previous, current) => current += previous) / values.length
                                : 0;
const createTermsSetExpectedLoan = (
    { interestRate, collateralRatio, maxLoanAmount, loanID, termsExpiry, collateralAmount, txTime },
    loanRequest) => {
    const expectedLoanTerms = {
        borrower: loanRequest.borrower,
        recipient: loanRequest.recipient,
        interestRate,
        collateralRatio,
        maxLoanAmount,
        duration: loanRequest.duration,
    };
    return {
        id: loanID,
        loanTerms: expectedLoanTerms,
        termsExpiry,
        loanStartTime: 0,
        collateral: collateralAmount,
        lastCollateralIn: collateralAmount == 0 ? 0 : txTime,
        principalOwed: 0,
        interestOwed: 0,
        status: TERMS_SET,
        liquidated: false,
    };
};

contract('TokenCollateralLoansCreateLoanWithTermsTest', function (accounts) {
    const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);
    let loanTermsConsensusEncoder;
    let collateralToken;
    let lendingTokenInstance;
    let instance;
    let loanTermsConsInstance;
    let settingsInstance;

    const timer = new Timer(web3);
    const owner = accounts[0];
    const borrowerAddress = accounts[2];
    const AMOUNT_LOAN_REQUEST = 12000;

    let loanRequest;
    let emptyRequest;

    let responseOne;
    let responseTwo;
    
    beforeEach('Setup for each test', async () => {
        lendingTokenInstance = await Mock.new();
        collateralToken = await LINKMock.new();
        loanTermsConsInstance = await Mock.new();
        const lendingPoolInstance = await Mock.new();
        const oracleInstance = await Mock.new();
        settingsInstance = await Settings.new(1, 1, 1, 1, THIRTY_DAYS, 1, daysToSeconds(30), 1)

        loanRequest = createLoanRequest(borrowerAddress, NULL_ADDRESS, 3, AMOUNT_LOAN_REQUEST, 4, 19, loanTermsConsInstance.address);
        emptyRequest = createLoanRequest(NULL_ADDRESS, NULL_ADDRESS, 0, 0, 0, 0, loanTermsConsInstance.address);

        responseOne = createUnsignedLoanResponse(accounts[3], 0, 1234, 6500, 10000, 3, loanTermsConsInstance.address);
        responseTwo = createUnsignedLoanResponse(accounts[4], 0, 1500, 6000, 10000, 2, loanTermsConsInstance.address);

        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            collateralToken.address,
        );
        const loanTermsConsensus = await LoanTermsConsensus.new();
        loanTermsConsensusEncoder = new LoanTermsConsensusEncoder(web3, loanTermsConsensus);

        const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken();
        lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address);
    });

    withData({
        _1_without_collateral: [3, 2, AMOUNT_LOAN_REQUEST, 0, 0, 0, undefined, false],
        _2_basic_collateral: [17, 2, AMOUNT_LOAN_REQUEST, 500000, 500000, 500000, undefined, false],
        _3_exceeds_max_loan_amount: [17, 2, (AMOUNT_LOAN_REQUEST - 500), 500000, 500000, 500000, 'AMOUNT_EXCEEDS_MAX_AMOUNT', true],
        _4_not_enough_balance: [20, 2, AMOUNT_LOAN_REQUEST, 450000, 500000, 500000, 'ERC20: transfer amount exceeds balance', true],
        _5_not_enough_allowance: [22, 3, AMOUNT_LOAN_REQUEST, 500000, 500000, 470000, 'NOT_ENOUGH_COLL_TOKENS_ALLOWANCE', true],
    }, function(loanID, senderIndex, assetSettingMaxAmount, mintAmount, collateralAmount, approveCollateralAmount, expectedErrorMessage, mustFail) {
        it(t('user', 'createLoanWithTerms', 'Should able to set loan terms.', mustFail), async function() {
            const sender = accounts[senderIndex];
            const interestRate = getAverage(responseOne.interestRate, responseTwo.interestRate);
            const collateralRatio = getAverage(responseOne.collateralRatio, responseTwo.collateralRatio);
            const maxLoanAmount = getAverage(responseOne.maxLoanAmount, responseTwo.maxLoanAmount);

            const cTokenInstance = await Mock.new();
            await settingsInstance.createAssetSettings(
                lendingTokenInstance.address,
                cTokenInstance.address,
                assetSettingMaxAmount,
                {
                    from: owner
                }
            );
            await instance.setLoanIDCounter(loanID);

            await loanTermsConsInstance.givenMethodReturn(
                loanTermsConsensusEncoder.encodeProcessRequest(emptyRequest, [responseOne]),
                loanTermsConsensusEncoder.encodeProcessRequestReturn(interestRate, collateralRatio, maxLoanAmount),
            );
            await collateralToken.mint(borrowerAddress, mintAmount, { from: sender });
            const initialTotalCollateral = await instance.totalCollateral();
            const initialContractCollateralTokenBalance = await collateralToken.balanceOf(instance.address);
            await collateralToken.approve(instance.address, approveCollateralAmount, { from: borrowerAddress });

            // Invocation
            let result;
            try {
                result = await instance.createLoanWithTerms(
                    loanRequest,
                    [responseOne, responseTwo],
                    collateralAmount,
                    {
                        from: borrowerAddress,
                    }
                );

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                const txTime = await timer.getCurrentTimestampInSeconds();
                const termsExpiry = txTime + THIRTY_DAYS;
                const finalTotalCollateral = await instance.totalCollateral();
                const finalContractCollateralTokenBalance = await collateralToken.balanceOf(instance.address);

                const loan = await instance.loans(loanID);
                
                const expectedLoan = createTermsSetExpectedLoan(
                    { interestRate, collateralRatio, maxLoanAmount, collateralAmount, loanID, termsExpiry, txTime },
                    loanRequest
                );
                assertLoan(loan, expectedLoan);
                assert.equal(parseInt(initialTotalCollateral) + collateralAmount, parseInt(finalTotalCollateral))
                assert.equal(parseInt(initialContractCollateralTokenBalance) + collateralAmount, parseInt(finalContractCollateralTokenBalance))
                loans
                    .loanTermsSet(result)
                    .emitted(
                        loanID, 
                        loanRequest.borrower,
                        loanRequest.recipient,
                        interestRate,
                        collateralRatio,
                        maxLoanAmount,
                        loanRequest.duration,
                        termsExpiry,
                    );
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});