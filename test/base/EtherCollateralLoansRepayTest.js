// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, ACTIVE, CLOSED } = require('../utils/consts');
const { createLoanTerms } = require('../utils/structs');
const BigNumber = require('bignumber.js');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");

contract('EtherCollateralLoansRepayTest', function (accounts) {
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let instance;
    let oracleInstance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let settingsInstance;

    const mockLoanID = 2831
    const totalCollateral = BigNumber("4500000000000000000") // 4.5 ETH
    const loanBorrower = accounts[3]
    const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, 0, 0, 0)
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        lendingTokenInstance = await Mock.new();
        oracleInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        const marketsInstance = await Mock.new();
        settingsInstance = await Mock.new();
        await settingsInstance.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeMarketsState(),
            marketsInstance.address
        );
        collateralTokenInstance = await Mock.new();
        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            collateralTokenInstance.address,
        )
    });

    withData({
        _1_to_pay_more_than_owed: [12345678, 40291, 13000000, BigNumber("3000000000000000000"), undefined, false],
        _2_to_pay_zero: [12345678, 40291, 0, BigNumber("3000000000000000000"), 'AMOUNT_VALUE_REQUIRED', true],
        _3_to_less_than_owed: [12345678, 40291, 12345677, BigNumber("3276312217812723563"), undefined, false],
        _4_to_pay_exact_owed: [12345678, 40291, 12385969, BigNumber("3276312217812723563"), undefined, false],
    }, function(
        loanPrincipalOwed,
        loanInterestOwed,
        amountToPay,
        loanCollateral,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'repay', 'Should able to repay your loan.', false), async function() {
            // Setup
            await instance.setLoan(mockLoanID, loanTerms, 0, 0, loanCollateral, 0, loanPrincipalOwed, loanInterestOwed, loanTerms.maxLoanAmount, ACTIVE, false) 
              
            await instance.setTotalCollateral(totalCollateral)

            // give the contract collateral (mock has a fallback)
            await web3.eth.sendTransaction({ from: accounts[1], to: instance.address, value: totalCollateral });

            const contractBalBefore = await web3.eth.getBalance(instance.address)
            const borrowerBalBefore = await web3.eth.getBalance(loanBorrower)

            try {
                await instance.repay(amountToPay, mockLoanID, { from: accounts[0] })
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                const totalAfter = await instance.totalCollateral.call()
                const contractBalAfter = await web3.eth.getBalance(instance.address)
                const borrowerBalAfter = await web3.eth.getBalance(loanBorrower)
    
                let newPrincipalOwed = 0
                let newInterestOwed = 0
                if (amountToPay > (loanPrincipalOwed + loanInterestOwed)) {
                    amountToPay = (loanPrincipalOwed + loanInterestOwed)
                }
                if (amountToPay < loanPrincipalOwed){
                    newPrincipalOwed = loanPrincipalOwed - amountToPay
                    newInterestOwed = loanInterestOwed
                } else {
                    newPrincipalOwed = 0
                    newInterestOwed = loanInterestOwed - (amountToPay - loanPrincipalOwed)
                }
    
                let loan = await instance.loans.call(mockLoanID)
    
                assert.equal(loan['principalOwed'].toString(), newPrincipalOwed)
                assert.equal(loan['interestOwed'].toString(), newInterestOwed)
    
                if (newPrincipalOwed + newInterestOwed == 0) {
                    assert.equal(parseInt(loan['collateral']), 0)
                    assert.equal(totalCollateral.minus(loanCollateral).toFixed(), totalAfter.toString())
                    assert.equal(BigNumber(contractBalBefore).minus(loanCollateral), contractBalAfter.toString())
                    assert.equal(BigNumber(borrowerBalBefore).plus(loanCollateral), borrowerBalAfter.toString())
                    assert.equal(parseInt(loan['status']), CLOSED)
                }
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});