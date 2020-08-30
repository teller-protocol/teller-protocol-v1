// JS Libraries
const { createLoanTerms } = require("../utils/structs");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { t, NULL_ADDRESS, ACTIVE } = require("../utils/consts");
const withData = require('leche').withData;

const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Escrow = artifacts.require("./base/Escrow.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");

contract('EscrowFactoryCreateEscrowTest', function (accounts) {
  const owner = accounts[0];
  let instance;
  let settingsInstance;
  let loans;

  beforeEach(async () => {
    settingsInstance = await createTestSettingsInstance(Settings, { from: owner, Mock });
    loans = await Loans.new();
    instance = await EscrowFactory.new();

    await instance.initialize(settingsInstance.address);
    // await settingsInstance.setEscrowFactory(instance.address);
    await loans.externalSetSettings(settingsInstance.address);
  })

  withData({
    _1_empty_borrower: [false, 1234, -1, true, 'BORROWER_MUSTNT_BE_EMPTY'],
    _2_platform_paused: [true, 1234, 2, true, 'PLATFORM_IS_PAUSED'],
  }, function(
    isPaused,
    loanID,
    borrowerIndex,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('loans', 'createEscrow', 'Should not be able to create an escrow contract.', mustFail), async function() {
      // Setup
      const borrower = borrowerIndex === -1 ? NULL_ADDRESS : accounts[borrowerIndex];
      const loanTerms = createLoanTerms(borrower, NULL_ADDRESS, 0, 0, 0, 0);
      await loans.setLoan(loanID, loanTerms, 0, 0, 123456, 0, 0, 0, loanTerms.maxLoanAmount, ACTIVE, false);

      if(isPaused) {
        await settingsInstance.pause({ from: owner});
      }
      try {
        // Invocation
        await loans.externalCreateEscrow(
            loanID,
            { from: owner }
        );

        // Assertions
        assert(!mustFail);
      } catch (error) {
        console.log("ERROR>>>>", error);
        assert(mustFail, error);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
