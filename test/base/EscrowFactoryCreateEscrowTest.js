// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { escrow } = require('../utils/events');
const { generateEscrowCloneAddressFromFactory } = require('../../utils/generateEscrowCloneAddress')

// Loans contracts

// Smart contracts
const Escrow = artifacts.require("./base/Escrow.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowFactoryCreateEscrowTest', function (accounts) {
  withData({
    _1_create_expected_escrow_address: [accounts[5], 1234, false, null],
  }, function(
    caller,
    loanID,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('loans', 'createEscrow', 'Should be able to create an escrow contract.', false), async function() {
      try {
        const escrowInstance = await Escrow.new();
        const escrowFactory = await EscrowFactory.new(escrowInstance.address);

        const expectedEscrowAddress = generateEscrowCloneAddressFromFactory(caller, loanID, escrowFactory.address, escrowInstance.address)

        // Invocation
        const tx = await escrowFactory.createEscrow(loanID, { from: caller });

        escrow
          .created(tx)
          .emitted(expectedEscrowAddress)

      } catch (error) {
        assert(mustFail);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
