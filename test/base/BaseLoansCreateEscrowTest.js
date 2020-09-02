// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { NULL_ADDRESS } = require("../utils/consts");
const { createLoanTerms } = require("../utils/structs");
const { ACTIVE } = require("../utils/consts");
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { escrowFactory } = require('../utils/events');
const LogicVersionsRegistryEncoder = require('../utils/encoders/LogicVersionsRegistryEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");

// Smart contracts
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('BaseLoansCreateEscrowTest', function (accounts) {
  const logicVersionsRegistryEncoder = new LogicVersionsRegistryEncoder(web3);
  const owner = accounts[0];
  let escrowFactoryInstance;
  let loans;

  beforeEach(async () => {
    escrowFactoryInstance = await EscrowFactory.new();
    const versionsRegistry = await Mock.new();
    const pairAggregatorRegistry = await Mock.new();
    const interestValidator = await Mock.new();
    const marketsInstance = await Mock.new();
    const atmSettingsInstance = await Mock.new();

    const constsInstance = await Mock.new();

    await versionsRegistry.givenMethodReturnAddress(
      logicVersionsRegistryEncoder.encodeConsts(),
      constsInstance.address
    );
    await versionsRegistry.givenMethodReturnBool(
      logicVersionsRegistryEncoder.encodeHasLogicVersion(),
      true
    );

    const settingsInstance = await createTestSettingsInstance(
      Settings,
      { 
        from: owner,
        Mock,
        onInitialize: async (
          instance,
          ) => {
            await instance.initialize(
              escrowFactoryInstance.address,
              versionsRegistry.address,
              pairAggregatorRegistry.address,
              marketsInstance.address,
              interestValidator.address,
              atmSettingsInstance.address
            );
          },
      });

    const oracleInstance = await Mock.new();
    const lendingPoolInstance = await Mock.new();
    const loanTermsConsInstance = await Mock.new();
    const collateralTokenInstance = await Mock.new();
    loans = await Loans.new();
    await loans.initialize(
      oracleInstance.address,
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      collateralTokenInstance.address,
    );
    
    await escrowFactoryInstance.initialize(settingsInstance.address);
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
        if (!mustFail) {
          escrowAddress = await loans.externalCreateEscrow.call(loanID);
        }

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
