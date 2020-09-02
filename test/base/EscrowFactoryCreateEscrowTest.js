// JS Libraries
const { createLoanTerms } = require("../utils/structs");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { t, NULL_ADDRESS, ACTIVE } = require("../utils/consts");
const withData = require('leche').withData;

const LogicVersionsRegistryEncoder = require("../utils/encoders/LogicVersionsRegistryEncoder");

const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");

contract('EscrowFactoryCreateEscrowTest', function (accounts) {
  const logicVersionsRegistryEncoder = new LogicVersionsRegistryEncoder(web3);
  const owner = accounts[0];
  let escrowFactoryInstance;
  let settingsInstance;
  let loans;
  let versionsRegistry;
  let consts;

  beforeEach(async () => {
    loans = await Loans.new();
    escrowFactoryInstance = await EscrowFactory.new();
    versionsRegistry = await Mock.new();
    consts = await Mock.new();

    await versionsRegistry.givenMethodReturnBool(
      logicVersionsRegistryEncoder.encodeConsts(),
      consts.address
    );

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
              atmSettings,
          }) => {
          await instance.initialize(
              escrowFactoryInstance.address,
              versionsRegistry.address,
              pairAggregatorRegistry.address,
              marketsState.address,
              interestValidator.address,
              atmSettings.address
          );
      },
      }
    );
    await escrowFactoryInstance.initialize(settingsInstance.address);
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
        assert(mustFail, error);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
