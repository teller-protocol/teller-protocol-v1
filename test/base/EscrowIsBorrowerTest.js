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
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");

// Smart contracts
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowIsBorrowerTest', function (accounts) {
  let escrowFactory;
  let settingsInstance;
  let instance;
  let loans;

  before(async () => {
    settingsInstance = await Mock.new();

    const oracleInstance = await Mock.new();
    const lendingPoolInstance = await Mock.new();
    const loanTermsConsInstance = await Mock.new();
    const marketsInstance = await Mock.new();
    const atmSettingsInstance = await Mock.new();
    loans = await Loans.new();
    await loans.initialize(
      oracleInstance.address,
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      marketsInstance.address,
      atmSettingsInstance.address
    );
    instance = await Escrow.new();
    escrowFactory = await EscrowFactory.new();
    await escrowFactory.initialize(settingsInstance.address, instance.address);
  })

  withData({
    _1_valid: [1234, 1, 1, false, null],
    _2_sender_not_borrower: [1234, 2, 1, true, 'CALLER_NOT_BORROWER'],
  }, function(
    loanID,
    borrowerIndex,
    senderIndex,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('loans', 'isBorrower', 'Should be able (or not) to test whether sender is a borrower or not.', mustFail), async function() {
      try {
        const borrower = borrowerIndex === -1 ? NULL_ADDRESS : accounts[borrowerIndex];
        const sender = senderIndex === -1 ? NULL_ADDRESS : accounts[senderIndex];
        const loanTerms = createLoanTerms(borrower, NULL_ADDRESS, 0, 0, 0, 0);
        await loans.setLoan(loanID, loanTerms, 0, 0, 123456, 0, 0, 0, loanTerms.maxLoanAmount, ACTIVE, false);

        await instance.mockInitialize(escrowFactory.address, settingsInstance.address, loans.address, loanID);

        // Invocation
        const result = await instance.externalIsBorrower({ from: sender });

        // Assertions
        assert(!mustFail);
        assert(result);
      } catch (error) {
        assert(mustFail, error);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
