// JS Libraries
const { createLoanTerms } = require("../utils/structs");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { createLoan } = require('../utils/loans');
const { t, NULL_ADDRESS, ACTIVE } = require("../utils/consts");
const withData = require("leche").withData;

const { escrowFactory } = require("../utils/events");
const { toBytes32 } = require("../utils/consts");

const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");
const Escrow = artifacts.require("./base/Escrow.sol");
const Settings = artifacts.require("./base/Settings.sol");
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");
const VersionsRegistry = artifacts.require("./base/LogicVersionsRegistry.sol");

// Libraries
const LoanLib = artifacts.require("../util/LoanLib.sol");

contract("EscrowFactoryCreateEscrowTest", function(accounts) {
  const owner = accounts[0];
  let escrowFactoryInstance;
  let settingsInstance;
  let loans;
  let versionsRegistry;

  beforeEach(async () => {
    const CETH = await Mock.new();
    const loanLib = await LoanLib.new();
    await Loans.link("LoanLib", loanLib.address);
    loans = await Loans.new();
    escrowFactoryInstance = await EscrowFactory.new();
    versionsRegistry = await VersionsRegistry.new();

    settingsInstance = await createTestSettingsInstance(
      Settings,
      {
        from: owner,
        Mock,
        onInitialize: async (
          instance,
          {
            marketsState,
            interestValidator,
            chainlinkAggregator,
            atmSettings
          }) => {
          await instance.initialize(
            escrowFactoryInstance.address,
            versionsRegistry.address,
            chainlinkAggregator.address,
            marketsState.address,
            interestValidator.address,
            atmSettings.address,
            (await Mock.new()).address,
            CETH.address
          );
        }
      }
    );

    const escrowLogic = await Escrow.new();
    await versionsRegistry.initialize(settingsInstance.address);
    await versionsRegistry.createLogicVersion(toBytes32(web3, "Escrow"), escrowLogic.address);
  });

  withData({
    _1_not_initialized: [ false, false, 1234, false, -1, true, "CONTRACT_NOT_INITIALIZED" ],
    _2_platform_paused: [ true, true, 1234, false, 2, true, "PLATFORM_IS_PAUSED" ],
    _3_escrow_already_exists: [ false, true, 1234, true, 2, true, "LOAN_ESCROW_ALREADY_EXISTS" ],
    _4_success: [ false, true, 1234, false, 2, false, null ]
  }, function(
    isPaused,
    initialize,
    loanID,
    duplicate,
    borrowerIndex,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("loans", "createEscrow", "Should not be able to create an escrow contract.", mustFail), async function() {
      // Setup
      const borrower = borrowerIndex === -1 ? NULL_ADDRESS : accounts[borrowerIndex];
      const loanTerms = createLoanTerms(borrower, NULL_ADDRESS, 0, 0, 0, 0);

      const loan = createLoan({
        id: loanID,
        loanTerms,
        collateral: 123456,
        borrowedAmount: loanTerms.maxLoanAmount,
        status: ACTIVE,
        liquidated: false
      });
      await loans.setLoan(loan);

      if (isPaused) {
        await settingsInstance.pause({ from: owner });
      }

      if (initialize) {
        await escrowFactoryInstance.initialize(settingsInstance.address);
      }

      if (duplicate) {
        const dummyEscrow = await Mock.new();
        await loans.setEscrowForLoan(loanID, dummyEscrow.address);
      }

      try {
        // Invocation
        const result = await escrowFactoryInstance.createEscrow(loans.address, loanID);

        // Assertions
        escrowFactory
          .escrowCreated(result)
          .emitted(borrower, loans.address, loanID);

        assert(!mustFail, "It passed but wasnt supposed to...");
      } catch (error) {
        assert.equal(error.reason, expectedErrorMessage);
        assert(mustFail, error.message);
        assert(error);
      }
    });
  });
});
