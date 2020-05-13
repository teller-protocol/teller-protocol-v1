// JS Libraries
const withData = require('leche').withData;
const abi = require('ethereumjs-abi')
const {
  t,
  NULL_ADDRESS,
  FIVE_MIN,
  TERMS_SET,
  THIRTY_DAYS
} = require('../utils/consts');
const { loans } = require('../utils/events');
const { createLoanRequest, createUnsignedLoanResponse } = require('../utils/structs');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansMock.sol");
const LoanTermsConsensus = artifacts.require("./mock/base/LoanTermsConsensus.sol");

contract('LoansSetLoanTermsTest', function (accounts) {
    let instance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let loanTermsConsTemplate;
    let processRequestEncoding;
    let oracleInstance;
    let settingsInstance;

    const borrowerAddress = accounts[2]

    const emptyRequest = createLoanRequest(NULL_ADDRESS, NULL_ADDRESS, 0, 0, 0, 0)

    const responseOne = createUnsignedLoanResponse(accounts[3], 0, 1234, 6500, 10000, 3)

    const responseTwo = createUnsignedLoanResponse(accounts[4], 0, 1500, 6000, 10000, 2)

    const loanRequest = createLoanRequest(borrowerAddress, NULL_ADDRESS, 3, 12000, 4, 19)
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        oracleInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        settingsInstance = await Mock.new()
        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address
        )

        loanTermsConsTemplate = await LoanTermsConsensus.new()
        processRequestEncoding = loanTermsConsTemplate
            .contract
            .methods
            .processRequest(emptyRequest, [responseOne])
            .encodeABI()
    });

    withData({
        // startTime is after mockTimeLastAccrued
        _1_no_msg_value: [3, 0],
        // endTime is not after startTime
        _2_with_msg_value: [17, 500000],
    }, function(
        mockLoanIDCounter,
        msgValue,
    ) {    
        it(t('user', 'setLoanTerms', 'Should able to set loan terms.', false), async function() {
            const interestRate = Math.floor((responseOne.interestRate + responseTwo.interestRate) / 2)
            const collateralRatio = Math.floor((responseOne.collateralRatio + responseTwo.collateralRatio) / 2)
            const maxLoanAmount = Math.floor((responseOne.maxLoanAmount + responseTwo.maxLoanAmount) / 2)

            await instance.setLoanIDCounter(mockLoanIDCounter)

            // mock consensus response
            await loanTermsConsInstance.givenMethodReturn(
                processRequestEncoding,
                abi.rawEncode(
                    ['uint256', 'uint256', 'uint256'],
                    [interestRate.toString(), collateralRatio.toString(), maxLoanAmount.toString()]
                )
            )

            const totalBefore = await instance.totalCollateral.call()
            const contractBalBefore = await web3.eth.getBalance(instance.address)

            // Invocation
            const tx = await instance.setLoanTerms(
                loanRequest,
                [responseOne, responseTwo],
                { value: msgValue }
            );

            const txTime = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp
            const termsExpiry = txTime + THIRTY_DAYS
            const lastCollateralIn = msgValue == 0 ? 0 : txTime

            const totalAfter = await instance.totalCollateral.call()
            const contractBalAfter = await web3.eth.getBalance(instance.address)

            const loan = await instance.loans.call(mockLoanIDCounter)
            
            assert.equal(loan['id'].toString(), mockLoanIDCounter)
            assert.equal(loan['loanTerms']['borrower'].toString(), loanRequest.borrower)
            assert.equal(loan['loanTerms']['recipient'].toString(), loanRequest.recipient)
            assert.equal(loan['loanTerms']['interestRate'].toString(), interestRate)
            assert.equal(loan['loanTerms']['collateralRatio'].toString(), collateralRatio)
            assert.equal(loan['loanTerms']['maxLoanAmount'].toString(), maxLoanAmount)
            assert.equal(loan['loanTerms']['duration'].toString(), loanRequest.duration)
            assert.equal(loan['termsExpiry'].toString(), termsExpiry)
            assert.equal(loan['loanStartTime'].toString(), 0)
            assert.equal(loan['collateral'].toString(), msgValue)
            assert.equal(loan['lastCollateralIn'].toString(), lastCollateralIn)
            assert.equal(loan['principalOwed'].toString(), 0)
            assert.equal(loan['interestOwed'].toString(), 0)
            assert.equal(loan['status'].toString(), TERMS_SET)
            assert.equal(loan['liquidated'], false)


            assert.equal(parseInt(totalBefore) + msgValue, parseInt(totalAfter))
            assert.equal(parseInt(contractBalBefore) + msgValue, parseInt(contractBalAfter))
            
            loans
                .loanTermsSet(tx)
                .emitted(
                    mockLoanIDCounter, 
                    loanRequest.borrower,
                    loanRequest.recipient,
                    interestRate,
                    collateralRatio,
                    maxLoanAmount,
                    loanRequest.duration
                )
        });
    });
});