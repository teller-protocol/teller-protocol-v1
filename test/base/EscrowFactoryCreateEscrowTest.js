// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { NULL_ADDRESS } = require("../utils/consts");
const withData = require('leche').withData;
const { t } = require('../utils/consts');

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
  let escrowLibrary;

  before(async () => {
    settingsInstance = await createTestSettingsInstance(Settings);
    loans = await Loans.new();
    escrowLibrary = await Escrow.new();
    instance = await EscrowFactory.new();

    await instance.initialize(settingsInstance.address, escrowLibrary.address);
    await settingsInstance.setEscrowFactory(instance.address);
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
      if(isPaused) {
        await settingsInstance.pause({ from: owner});
      }
      try {
        // Invocation
        await loans.createEscrow(
            borrower,
            loanID,
            { from: owner }
        );

        // Assertions
        assert(!mustFail);
      } catch (error) {
        assert(mustFail, error);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
