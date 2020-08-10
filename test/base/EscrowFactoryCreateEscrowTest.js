// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { generateEscrowCloneAddressFromFactory } = require("../../utils/generateEscrowCloneAddress");
const { THIRTY_DAYS, NULL_ADDRESS } = require("../utils/consts");
const { TermsExpiryTime } = require("../utils/platformSettingsNames");
const { createLoanTerms } = require("../utils/structs");
const { ACTIVE } = require("../utils/consts");
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { escrow } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");

// Smart contracts
const Escrow = artifacts.require("./base/Escrow.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('EscrowFactoryCreateEscrowTest', function (accounts) {
  let escrowFactory;
  let escrowLibrary;
  let loans;
  let borrower = accounts[6]
  let mockLoanID = 1234

  before(async () => {
    escrowLibrary = await Escrow.new();
    escrowFactory = await EscrowFactory.new(escrowLibrary.address);

    const settingsInstance = await createTestSettingsInstance(Settings);
    await settingsInstance.setEscrowFactory(escrowFactory.address)

    const oracleInstance = await Mock.new();
    const lendingPoolInstance = await Mock.new();
    const loanTermsConsInstance = await Mock.new();
    loans = await Loans.new();
    await loans.initialize(
      oracleInstance.address,
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address
    )

    const loanTerms = createLoanTerms(borrower, NULL_ADDRESS, 0, 0, 0, 0)
    await loans.setLoan(mockLoanID, loanTerms, 0, 0, 123456, 0, 0, 0, loanTerms.maxLoanAmount, ACTIVE, false)
  })

  withData({
    _1_create_expected_escrow_address: [1234, false, null],
  }, function(
    loanID,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('loans', 'createEscrow', 'Should be able to create an escrow contract.', false), async function() {
      try {
        const generatedEscrowAddress = generateEscrowCloneAddressFromFactory(loans.address, loanID, escrowFactory.address, escrowLibrary.address)

        // Invocation
        const tx = await loans.createEscrow(loanID);

        await escrow
          .created(tx, EscrowFactory)
          .emitted(borrower, loans.address, mockLoanID.toString(), generatedEscrowAddress)

        assert(!mustFail)
      } catch (error) {
        assert(mustFail, error);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
