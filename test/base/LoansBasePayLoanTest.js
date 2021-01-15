// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, ACTIVE } = require('../utils/consts');
const { createLoanTerms } = require('../utils/structs');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');

// Smart contracts
const Loans = artifacts.require('./mock/base/LoansBaseMock.sol');

// Libraries
const LoanLib = artifacts.require('../util/LoanLib.sol');

contract('LoansBasePayLoanTest', function (accounts) {
  let instance;
  let settingsInstance;

  const mockLoanID = 7;

  beforeEach('Setup for each test', async () => {
    const lendingPoolInstance = await Mock.new();
    const loanTermsConsInstance = await Mock.new();
    settingsInstance = await Mock.new();
    const collateralTokenInstance = await Mock.new();
    const loanLib = await LoanLib.new();
    await Loans.link('LoanLib', loanLib.address);
    instance = await Loans.new();
    await instance.initialize(
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      collateralTokenInstance.address
    );
  });

  withData(
    {
      _1_less_than_interest: [150, 61, 53],
      _2_more_than_interest: [150, 61, 198],
      _3_no_interest_left: [61, 0, 45],
      _4_full_amount: [150, 61, 211],
    },
    function (mockPrincipalOwed, mockInterestOwed, toPay) {
      it(
        t('user', 'payLoan', 'Should able to pay loan correctly.', false),
        async function () {
          // Setup
          const emptyLoanTerms = createLoanTerms(NULL_ADDRESS, NULL_ADDRESS, 0, 0, 0, 0);
          await instance.setLoan(
            mockLoanID,
            emptyLoanTerms,
            0,
            0,
            0,
            0,
            mockPrincipalOwed,
            mockInterestOwed,
            emptyLoanTerms.maxLoanAmount,
            ACTIVE,
            false
          );

          // Invocation
          await instance.externalPayLoan(mockLoanID, toPay);

          // Assertions
          const loan = await instance.loans(mockLoanID);

          let newPrincipalOwed = 0;
          let newInterestOwed = 0;
          if (toPay >= mockInterestOwed) {
            newInterestOwed = 0;
            toPay -= mockInterestOwed;
            newPrincipalOwed = mockPrincipalOwed - toPay;
          } else {
            newInterestOwed = mockInterestOwed - toPay;
            newPrincipalOwed = mockPrincipalOwed;
          }
          assert.equal(loan.interestOwed.toString(), newInterestOwed);
          assert.equal(loan.principalOwed.toString(), newPrincipalOwed);
        }
      );
    }
  );
});
