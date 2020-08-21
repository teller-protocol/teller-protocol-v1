// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { escrowFactory } = require('../utils/events');
const assert = require('assert');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowFactoryUpgradeEscrowLogicTest', function (accounts) {
  const ownerIndex = 0;
  let escrowV1;
  let escrowV2;
  let instance;

  beforeEach(async () => {
    escrowV1 = await Mock.new();
    escrowV2 = await Mock.new();

    instance = await EscrowFactory.new();
    const settings = await Mock.new();
    await instance.initialize(settings.address, escrowV1.address, { from: accounts[ownerIndex] });
  })

  withData({
    _1_basic: [accounts[ownerIndex], false, null],
    _2_not_owner: [accounts[ownerIndex + 1], true, 'PauserRole: caller does not have the Pauser role'],
  }, function(
    caller,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('escrowFactory', 'upgradeEscrowLogic', 'Should be able (or not) to remove a dapp.', mustFail), async function() {
      try {
        const v1Logic = await instance.escrowLogic.call();
        assert.equal(escrowV1.address, v1Logic, "V1 logic does not match")

        const result = await instance.upgradeEscrowLogic(escrowV2.address, { from: caller });

        const v2Logic = await instance.escrowLogic.call();
        assert.equal(escrowV2.address, v2Logic, "V2 logic does not match")

        escrowFactory
          .escrowLogicUpgraded(result)
          .emitted(caller, escrowV1.address, escrowV2.address);
      } catch (error) {
        assert(mustFail);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});

