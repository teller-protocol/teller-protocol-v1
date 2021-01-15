// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, ACTIVE } = require('../utils/consts');
const { createLoanTerms } = require('../utils/structs');
const { createLoan } = require('../utils/loans');

const { loans } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');

// Smart contracts
const Loans = artifacts.require('./mock/base/EtherCollateralLoansMock.sol');

// Libraries
const LoanLib = artifacts.require('../util/LoanLib.sol');

contract('EtherCollateralLoansDepositCollateralTest', function (accounts) {
  let instance;
  let loanTermsConsInstance;
  let lendingPoolInstance;
  let settingsInstance;
  let atmSettingsInstance;

  const mockLoanID = 7;

  beforeEach('Setup for each test', async () => {
    lendingPoolInstance = await Mock.new();
    loanTermsConsInstance = await Mock.new();
    settingsInstance = await Mock.new();
    atmSettingsInstance = await Mock.new();
    const loanLib = await LoanLib.new();
    await Loans.link('LoanLib', loanLib.address);
    instance = await Loans.new();
    await instance.initialize(
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      atmSettingsInstance.address
    );
  });

  withData(
    {
      _1_borrower_mismatch: [
        accounts[1],
        accounts[2],
        5000000,
        123456,
        false,
        true,
        'BORROWER_LOAN_ID_MISMATCH',
      ],
      _2_deposit_zero: [
        accounts[1],
        accounts[1],
        0,
        123456,
        false,
        true,
        'CANNOT_DEPOSIT_ZERO',
      ],
      _3_deposit_more: [
        accounts[1],
        accounts[1],
        5000000,
        123456,
        false,
        false,
        undefined,
      ],
      _4_incorrect_value: [
        accounts[1],
        accounts[1],
        5000000,
        123456,
        true,
        true,
        'INCORRECT_ETH_AMOUNT',
      ],
    },
    function (
      loanBorrower,
      specifiedBorrower,
      msgValue,
      mockCollateral,
      incorrectEthValue,
      mustFail,
      expectedErrorMessage
    ) {
      it(
        t('user', 'depositCollateral', 'Should able to deposit collateral.', false),
        async function () {
          // Setup
          const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, 0, 0, 0);

          const loan = createLoan({
            id: mockLoanID,
            loanTerms,
            collateral: mockCollateral,
            borrowedAmount: loanTerms.maxLoanAmount,
            status: ACTIVE,
            liquidated: false,
          });

          await instance.setLoan(loan);

          const ethAmount = incorrectEthValue ? msgValue + 1 : msgValue;

          try {
            const contractBalBefore = await web3.eth.getBalance(instance.address);
            const totalBefore = await instance.totalCollateral.call();

            let tx = await instance.depositCollateral(
              specifiedBorrower,
              mockLoanID,
              ethAmount,
              { from: specifiedBorrower, value: msgValue }
            );

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(tx);
            let txTimestamp = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp;

            loans.collateralDeposited(tx).emitted(mockLoanID, loanBorrower, msgValue);

            const totalAfter = await instance.totalCollateral.call();
            const contractBalAfter = await web3.eth.getBalance(instance.address);

            let loan = await instance.loans.call(mockLoanID);
            assert.equal(parseInt(loan['collateral']), mockCollateral + msgValue);
            assert.equal(parseInt(totalBefore) + msgValue, parseInt(totalAfter));
            assert.equal(
              parseInt(contractBalBefore) + msgValue,
              parseInt(contractBalAfter)
            );

            assert.equal(parseInt(loan['lastCollateralIn']), txTimestamp);
          } catch (error) {
            assert(mustFail);
            assert(error);
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );
});
