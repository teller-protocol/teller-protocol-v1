// JS Libraries
const withData = require('leche').withData;
const { t, createMocks } = require('../utils/consts');
const { escrowFactory } = require('../utils/events');
const assert = require('assert');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowFactoryUpgradeEscrowLogicTest', function (accounts) {
  const ownerIndex = 0;
  let mocks = [];
  let instance;

  beforeEach(async () => {
    mocks = await createMocks(Mock, 2)

    instance = await EscrowFactory.new();
    const settings = await Settings.new();
    await settings.initialize(accounts[ownerIndex]);
    await instance.initialize(settings.address, mocks[0], { from: accounts[ownerIndex] });
  })

  withData({
    _1_basic: [accounts[ownerIndex], 1, false, null],
    _2_not_pauser: [accounts[ownerIndex + 1], 1, true, 'NOT_PAUSER'],
    _3_same_logic: [accounts[ownerIndex], 0, true, 'NEW_ESCROW_LOGIC_SAME'],
    _4_not_contract: [accounts[ownerIndex], 99, true, 'ESCROW_LOGIC_MUST_BE_A_CONTRACT']
  }, function(
    caller,
    upgradeLogicIndex,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('escrowFactory', 'upgradeEscrowLogic', 'Should be able (or not) to upgrade the current Escrow logic implementation.', mustFail), async function() {
      // Setup
      const v1Logic = await instance.escrowLogic.call();
      assert.equal(mocks[0], v1Logic, "V1 logic does not match");
      const v2LogicAddress = upgradeLogicIndex === 99 ? caller : mocks[upgradeLogicIndex];

      try {
        // Invocation
        const result = await instance.upgradeEscrowLogic(v2LogicAddress, { from: caller });

        // Assertions
        assert(!mustFail);
        const v2Logic = await instance.escrowLogic.call();
        assert.equal(v2LogicAddress, v2Logic, "V2 logic does not match")

        escrowFactory
          .escrowLogicUpgraded(result)
          .emitted(caller, mocks[0], v2LogicAddress);
      } catch (error) {
        assert(mustFail);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});

