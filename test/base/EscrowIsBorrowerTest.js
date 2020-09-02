// JS Libraries
const { NULL_ADDRESS } = require("../utils/consts");
const { createLoanTerms } = require("../utils/structs");
const { ACTIVE } = require("../utils/consts");
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { assert } = require("chai");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");
const Escrow = artifacts.require("./base/Escrow.sol");

// Smart contracts
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowIsBorrowerTest', function (accounts) {
  let escrowFactory;
  let settingsInstance;
  let instance;
  let loans;

  beforeEach(async () => {
    settingsInstance = await Mock.new();
    const oracleInstance = await Mock.new();
    const lendingPoolInstance = await Mock.new();
    const loanTermsConsInstance = await Mock.new();
    const collateralInstance = await Mock.new();
    loans = await Loans.new();
    await loans.initialize(
      oracleInstance.address,
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      collateralInstance.address
    );
    instance = await Escrow.new();
    escrowFactory = await EscrowFactory.new();
    await escrowFactory.initialize(settingsInstance.address);
  })

  withData({
    _1_valid: [1234, 1, 1, false],
    _2_sender_not_borrower: [1234, 2, 1, true],
  }, function(
    loanID,
    borrowerIndex,
    senderIndex,
    mustFail
  ) {
    it(t('loans', 'isBorrower', 'Should be able (or not) to test whether sender is a borrower or not.', mustFail), async function() {
      // Setup
      const borrower = borrowerIndex === -1 ? NULL_ADDRESS : accounts[borrowerIndex];
      const sender = senderIndex === -1 ? NULL_ADDRESS : accounts[senderIndex];
      const loanTerms = createLoanTerms(borrower, NULL_ADDRESS, 0, 0, 0, 0);
      await loans.setLoan(loanID, loanTerms, 0, 0, 123456, 0, 0, 0, loanTerms.maxLoanAmount, ACTIVE, false);

      await instance.initialize(loans.address, loanID);
      try {
        // Invocation
        const result = await instance.getBorrower();
        
        // Assertions
        assert(!mustFail);
        assert(result);
        assert.equal(
          result,
          borrower,
          "Borrower is not equal to the loan."
        )
      } catch (error) {
        assert(mustFail, error);
        assert(error);
      }
    });
  });
});
