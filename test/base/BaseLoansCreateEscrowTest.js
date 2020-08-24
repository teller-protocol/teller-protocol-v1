// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { NULL_ADDRESS } = require("../utils/consts");
const { createLoanTerms } = require("../utils/structs");
const { ACTIVE } = require("../utils/consts");
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { escrowFactory } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");

// Smart contracts
const Escrow = artifacts.require("./base/Escrow.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('BaseLoansCreateEscrowTest', function (accounts) {
  let instance;
  let escrowLibrary;
  let loans;

  beforeEach(async () => {
    const settingsInstance = await createTestSettingsInstance(Settings);

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
    escrowLibrary = await Escrow.new();
    instance = await EscrowFactory.new();
    await instance.initialize(settingsInstance.address, escrowLibrary.address);

    await settingsInstance.setEscrowFactory(instance.address)
  })

  withData({
    _1_valid: [1234, 1, false, null],
    _2_empty_borrower: [1234, -1, true, 'BORROWER_MUSTNT_BE_EMPTY'],
  }, function(
    loanID,
    borrowerIndex,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('loans', 'createEscrow', 'Should be able (or not) to create an escrow contract.', mustFail), async function() {
      try {
        const borrower = borrowerIndex === -1 ? NULL_ADDRESS : accounts[borrowerIndex];
        const loanTerms = createLoanTerms(borrower, NULL_ADDRESS, 0, 0, 0, 0);
        await loans.setLoan(loanID, loanTerms, 0, 0, 123456, 0, 0, 0, loanTerms.maxLoanAmount, ACTIVE, false);

        // Invocation
        let escrowAddress
        // If the test must fail from the resulting transaction, then the call to the function (not a transaction) will also fail but as a different Error object
        if (!mustFail)
          escrowAddress = await loans.externalCreateEscrow.call(loanID);
        const result = await loans.externalCreateEscrow(loanID);

        // Assertions
        assert(!mustFail);

        await escrowFactory
          .escrowCreated(result, EscrowFactory)
          .emitted(borrower, loans.address, loanID.toString(), escrowAddress);
      } catch (error) {
        assert(mustFail, error);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
