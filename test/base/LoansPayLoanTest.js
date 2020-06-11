// JS Libraries
const withData = require('leche').withData;
const { t, FIVE_MIN, NULL_ADDRESS, ACTIVE } = require('../utils/consts');
const { createLoanTerms } = require('../utils/structs');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/EtherLoansMock.sol");

contract('LoansPayLoanTest', function (accounts) {
    let instance;
    let oracleInstance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let settingsInstance;

    const mockLoanID = 7
    
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
    });

    withData({
        _1_less_than_principal: [150, 61, 73],
        _2_more_than_principal: [150, 61, 198],
        _3_no_principal_left: [0, 61, 45],
        _4_full_amount: [150, 61, 211],
    }, function(
        mockPrincipalOwed,
        mockInterestOwed,
        toPay
    ) {
        it(t('user', 'payLoan', 'Should able to pay loan correctly.', false), async function() {
            // Setup
            const emptyLoanTerms = createLoanTerms(NULL_ADDRESS, NULL_ADDRESS, 0, 0, 0, 0)
            await instance.setLoan(mockLoanID, emptyLoanTerms, 0, 0, 0, 0, mockPrincipalOwed, mockInterestOwed, emptyLoanTerms.maxLoanAmount, ACTIVE, false)
            
            await instance.externalPayLoan(mockLoanID, toPay)

            const loan = await instance.loans.call(mockLoanID)

            let newPrincipalOwed = 0
            let newInterestOwed = 0
            if (toPay < mockPrincipalOwed){
                newPrincipalOwed = mockPrincipalOwed - toPay
                newInterestOwed = mockInterestOwed
            } else {
                newPrincipalOwed = 0
                newInterestOwed = mockInterestOwed - (toPay - mockPrincipalOwed)
            }

            assert.equal(loan['principalOwed'].toString(), newPrincipalOwed)
            assert.equal(loan['interestOwed'].toString(), newInterestOwed)

        })

    })

})