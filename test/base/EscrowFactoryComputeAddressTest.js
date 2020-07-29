// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { generateEscrowCloneAddressFromFactory } = require('../../utils/generateEscrowCloneAddress')
const assert = require('assert');

// Mock contracts

// Smart contracts
const Escrow = artifacts.require("./base/Escrow.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowFactoryComputeAddressTest', function (accounts) {
  let expectedEscrowAddress;
  let escrow;
  let escrowFactory;

  beforeEach(async () => {
    escrow = await Escrow.new();
    escrowFactory = await EscrowFactory.new(escrow.address);
  })

  withData({
    _1_computes_expected_address: [accounts[5], accounts[5], 1234, false, null],
    _2_computes_different_address: [accounts[5], accounts[6], 1234, false, null],
  }, function(
    generateCaller,
    caller,
    loanID,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('loans factory', 'computeEscrowAddress', 'Should be able to compute escrow clone contract address.', false), async function() {
      try {
        const computedEscrowAddress = await escrowFactory.computeEscrowAddress.call(loanID, { from: caller })

        expectedEscrowAddress = generateEscrowCloneAddressFromFactory(generateCaller, loanID, escrowFactory.address, escrow.address)

        generateCaller === caller
          ? assert.equal(computedEscrowAddress, expectedEscrowAddress)
          : assert.notEqual(computedEscrowAddress, expectedEscrowAddress)
      } catch (error) {
        assert(mustFail);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
