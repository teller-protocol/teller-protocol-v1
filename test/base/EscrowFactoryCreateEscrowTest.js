// JS Libraries
const { createLoanTerms } = require("../utils/structs");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { t, NULL_ADDRESS, ACTIVE } = require("../utils/consts");
const withData = require("leche").withData;

const { escrowFactory } = require("../utils/events");
const { toBytes32 } = require("../utils/consts");

const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const EscrowFactory = artifacts.require("./mock/base/EscrowFactoryMock.sol");
const Escrow = artifacts.require("./base/Escrow.sol");
const Settings = artifacts.require("./base/Settings.sol");
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");
const VersionsRegistry = artifacts.require("./base/LogicVersionsRegistry.sol");

contract("EscrowFactoryCreateEscrowTest", function(accounts) {
  const owner = accounts[0];
  let escrowFactoryInstance;
  let settingsInstance;
  let loans;
  let versionsRegistry;

  beforeEach(async () => {
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
            pairAggregatorRegistry,
            atmSettings
          }) => {
          await instance.initialize(
            escrowFactoryInstance.address,
            versionsRegistry.address,
            pairAggregatorRegistry.address,
            marketsState.address,
            interestValidator.address,
            atmSettings.address
          );
        }
      }
    );
    await loans.externalSetSettings(settingsInstance.address);

    const escrowLogic = await Escrow.new();
    await versionsRegistry.initialize(settingsInstance.address)
    await versionsRegistry.createLogicVersion(toBytes32(web3, 'Escrow'), escrowLogic.address)
  });

  withData({
    _1_not_initialized: [ false, false, 1234, -1, true, "CONTRACT_NOT_INITIALIZED" ],
    _2_platform_paused: [ true, true, 1234, 2, true, "PLATFORM_IS_PAUSED" ],
    _3_success: [ false, true, 1234, 2, false, null ],
  }, function(
    isPaused,
    initialize,
    loanID,
    borrowerIndex,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("loans", "createEscrow", "Should not be able to create an escrow contract.", mustFail), async function() {
      // Setup
      const borrower = borrowerIndex === -1 ? NULL_ADDRESS : accounts[borrowerIndex];
      const loanTerms = createLoanTerms(borrower, NULL_ADDRESS, 0, 0, 0, 0);
      await loans.setLoan(loanID, loanTerms, 0, 0, 123456, 0, 0, 0, loanTerms.maxLoanAmount, ACTIVE, false);

      if (isPaused) {
        await settingsInstance.pause({ from: owner });
      }

      if (initialize) {
        await escrowFactoryInstance.initialize(settingsInstance.address);
      }

      try {
        // Invocation
        const result = await escrowFactoryInstance.externalCreateEscrow(loans.address, loanID);

        // Assertions
        escrowFactory
          .escrowCreated(result)
          .emitted(borrower, loans.address, loanID);

        assert(!mustFail, 'It passed but wasnt supposed to...');
      } catch (error) {
        console.error(error)
        assert.equal(error.reason, expectedErrorMessage);
        assert(mustFail, error.message);
        assert(error);
      }
    });
  });
});
