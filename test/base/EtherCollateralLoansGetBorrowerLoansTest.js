// JS Libraries
const withData = require('leche').withData;
const abi = require('ethereumjs-abi')
const {
  t,
  NULL_ADDRESS,
  THIRTY_DAYS
} = require('../utils/consts');
const { createLoanRequest, createUnsignedLoanResponse } = require('../utils/structs');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");
const Settings = artifacts.require("./base/Settings.sol");
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");

contract('EtherCollateralLoansGetBorrowerLoansTest', function (accounts) {
    let instance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let loanTermsConsTemplate;
    let processRequestEncoding;
    let oracleInstance;
    let settingsInstance;

    const borrowerAddress = accounts[2]

    let emptyRequest
    let responseOne
    let responseTwo
    let loanRequest
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        oracleInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        settingsInstance = await Settings.new(1, 1, 1, 1, THIRTY_DAYS, 1)
        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address
        )
        responseOne = createUnsignedLoanResponse(accounts[3], 0, 1234, 6500, 10000, 3, loanTermsConsInstance.address)
        responseTwo = createUnsignedLoanResponse(accounts[4], 0, 1500, 6000, 10000, 2, loanTermsConsInstance.address)
        loanRequest = createLoanRequest(borrowerAddress, NULL_ADDRESS, 3, 12000, 4, 19, loanTermsConsInstance.address)
        emptyRequest = createLoanRequest(NULL_ADDRESS, NULL_ADDRESS, 0, 0, 0, 0, loanTermsConsInstance.address)

        loanTermsConsTemplate = await LoanTermsConsensus.new()
        processRequestEncoding = loanTermsConsTemplate
            .contract
            .methods
            .processRequest(emptyRequest, [responseOne])
            .encodeABI()
    });

    withData({
        _1_valid_no_msg_value: [3, 0],
        _2_valid_with_msg_value: [17, 500000],
    }, function(mockLoanIDCounter, msgValue) {
        it(t('user', 'getBorrowerLoans', 'Should able to get the borrower loan ids.', false), async function() {
            const interestRate = Math.floor((responseOne.interestRate + responseTwo.interestRate) / 2);
            const collateralRatio = Math.floor((responseOne.collateralRatio + responseTwo.collateralRatio) / 2);
            const maxLoanAmount = Math.floor((responseOne.maxLoanAmount + responseTwo.maxLoanAmount) / 2);

            await instance.setLoanIDCounter(mockLoanIDCounter);

            // mock consensus response
            await loanTermsConsInstance.givenMethodReturn(
                processRequestEncoding,
                abi.rawEncode(
                    ['uint256', 'uint256', 'uint256'],
                    [interestRate.toString(), collateralRatio.toString(), maxLoanAmount.toString()]
                )
            );
            await instance.createLoanWithTerms(
                loanRequest,
                [responseOne, responseTwo],
                msgValue,
                {
                    from: borrowerAddress,
                    value: msgValue
                }
            );

            // Invocation
            const borrowedLoans = await instance.getBorrowerLoans(borrowerAddress);

            // Assertions
            assert.equal(borrowedLoans[0].toString(), mockLoanIDCounter.toString());
            assert.equal(borrowedLoans.length, 1);
        });
    });
});