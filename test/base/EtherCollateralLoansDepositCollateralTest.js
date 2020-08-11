// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, ACTIVE } = require('../utils/consts');
const { createLoanTerms } = require('../utils/structs');

const { loans } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");

contract('EtherCollateralLoansDepositCollateralTest', function (accounts) {
    let instance;
    let oracleInstance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let settingsInstance;
    let marketsInstance;

    const mockLoanID = 7
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        oracleInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        settingsInstance = await Mock.new()
        marketsInstance = await Mock.new();
        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            marketsInstance.address
        )
    });

    withData({
        _1_borrower_mismatch: [accounts[1], accounts[2], 5000000, 123456, false, true, 'BORROWER_LOAN_ID_MISMATCH'],
        _2_deposit_zero: [accounts[1], accounts[1], 0, 123456, false, true, 'CANNOT_DEPOSIT_ZERO'],
        _3_deposit_more: [accounts[1], accounts[1], 5000000, 123456, false, false, undefined],
        _4_incorrect_value: [accounts[1], accounts[1], 5000000, 123456, true, true, 'INCORRECT_ETH_AMOUNT'],
    }, function(
        loanBorrower,
        specifiedBorrower,
        msgValue,
        mockCollateral,
        incorrectEthValue,
        mustFail,
        expectedErrorMessage
    ) {
        it(t('user', 'depositCollateral', 'Should able to deposit collateral.', false), async function() {
            // Setup
            const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, 0, 0, 0)
            await instance.setLoan(mockLoanID, loanTerms, 0, 0, mockCollateral, 0, 0, 0, loanTerms.maxLoanAmount, ACTIVE, false)

            const ethAmount = incorrectEthValue ? msgValue+1 : msgValue

            try {
                const contractBalBefore = await web3.eth.getBalance(instance.address)
                const totalBefore = await instance.totalCollateral.call()

                let tx = await instance.depositCollateral(specifiedBorrower, mockLoanID, ethAmount, { value: msgValue })
                let txTimestamp = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp

                loans
                  .collateralDeposited(tx)
                  .emitted(mockLoanID, loanBorrower, msgValue)

                const totalAfter = await instance.totalCollateral.call()
                const contractBalAfter = await web3.eth.getBalance(instance.address)

                let loan = await instance.loans.call(mockLoanID)
                assert.equal(parseInt(loan['collateral']), (mockCollateral + msgValue))
                assert.equal(parseInt(totalBefore) + msgValue, parseInt(totalAfter))
                assert.equal(parseInt(contractBalBefore) + msgValue, parseInt(contractBalAfter))

                assert.equal(parseInt(loan['lastCollateralIn']), txTimestamp)
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
            
        });
    });
});