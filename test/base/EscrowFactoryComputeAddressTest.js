// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { generateEscrowCloneAddressFromFactory } = require('../../utils/generateEscrowCloneAddress')
const assert = require('assert');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Escrow = artifacts.require("./base/Escrow.sol");
const EscrowFactoryMock = artifacts.require("./mock/base/EscrowFactoryMock.sol");

contract('EscrowFactoryComputeAddressTest', function (accounts) {
  let escrow;
  let escrowFactory;

  beforeEach(async () => {
    escrow = await Escrow.new();
    escrowFactory = await EscrowFactoryMock.new();
    const settings = await Mock.new();
    await escrowFactory.initialize(settings.address, escrow.address);
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
    it(t('escrowFactory', 'computeEscrowAddress', 'Should be able to compute an escrow contract address.', mustFail), async function() {
      // Setup
      const expectedEscrowAddress = generateEscrowCloneAddressFromFactory(generateCaller, loanID, escrowFactory.address, escrow.address)

      try {
        // Invocation
        const computedEscrowAddress = await escrowFactory.externalComputeEscrowAddress(loanID, { from: caller });

        // Assertions
        assert(!mustFail, 'It should have failed because data is invalid.');
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
