// JS Libraries
const EscrowFactoryEncoder = require('../utils/encoders/EscrowFactoryEncoder');
const { createTestSettingsInstance } = require('../utils/settings-helper');
const { NULL_ADDRESS } = require('../utils/consts');
const { createLoanTerms } = require('../utils/structs');
const { ACTIVE } = require('../utils/consts');
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');
const Loans = artifacts.require('./mock/base/LoansBaseMock.sol');

// Smart contracts
const Settings = artifacts.require('./base/Settings.sol');

// Libraries
const LoanLib = artifacts.require('../util/LoanLib.sol');

contract('LoansBaseCreateEscrowTest', function (accounts) {
  const escrowFactoryEncoder = new EscrowFactoryEncoder(web3);

  const owner = accounts[0];
  let escrowFactoryInstance;
  let loansInstance;

  beforeEach(async () => {
    const settings = await createTestSettingsInstance(Settings, {
      from: owner,
      Mock,
      initialize: true,
      onInitialize: async (instance, { escrowFactory }) => {
        escrowFactoryInstance = escrowFactory;
        await escrowFactoryInstance.givenMethodReturnAddress(
          escrowFactoryEncoder.encodeCreateEscrow(),
          NULL_ADDRESS
        );
      },
    });
    const loanLib = await LoanLib.new();
    await Loans.link('LoanLib', loanLib.address);
    loansInstance = await Loans.new();
    await loansInstance.initialize(
      (await Mock.new()).address,
      (await Mock.new()).address,
      settings.address,
      (await Mock.new()).address
    );
  });

  withData(
    {
      _1_call_escrow_factory_create_escrow: [1234, 1, false, null],
    },
    function (loanID, borrowerIndex, mustFail, expectedErrorMessage) {
      it(
        t(
          'loans',
          'createEscrow',
          'Should be able (or not) to create an escrow contract.',
          mustFail
        ),
        async function () {
          try {
            const borrower =
              borrowerIndex === -1 ? NULL_ADDRESS : accounts[borrowerIndex];
            const loanTerms = createLoanTerms(borrower, NULL_ADDRESS, 0, 0, 0, 0);
            await loansInstance.setLoan(
              loanID,
              loanTerms,
              0,
              0,
              123456,
              0,
              0,
              0,
              loanTerms.maxLoanAmount,
              ACTIVE,
              false
            );

            // Invocation
            let escrowAddress;
            // If the test must fail from the resulting transaction, then the call to the function (not a transaction) will also fail but as a different Error object
            if (!mustFail) {
              escrowAddress = await loansInstance.externalCreateEscrow.call(loanID);
            }

            await loansInstance.externalCreateEscrow(loanID);

            const callCount = await escrowFactoryInstance.invocationCountForMethod.call(
              escrowFactoryEncoder.encodeCreateEscrow()
            );

            // Assertions
            assert.equal(callCount.toString(), '1', 'Create Escrow was not called!');
            assert(!mustFail);
          } catch (error) {
            assert.equal(error.reason, expectedErrorMessage);
            assert(mustFail, error.message);
            assert(error);
          }
        }
      );
    }
  );
});
