// JS Libraries
const withData = require('leche').withData;
const { t, createMocks, NULL_ADDRESS } = require('../utils/consts');
const { escrowFactory } = require('../utils/events');
const assert = require('assert');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Escrow = artifacts.require("./base/Escrow.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowFactoryRemoveDAppTest', function (accounts) {
  const owner = accounts[0];
  let escrow;
  let instance;
  let mocks;

  beforeEach(async () => {
    escrow = await Escrow.new();
    instance = await EscrowFactory.new();
    const settings = await Mock.new();
    await instance.initialize(settings.address, escrow.address, { from: owner });

    mocks = await createMocks(Mock, 10);
  })

  const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

  withData({
    _1_basic: [[1, 2], accounts[0], 2, false, null],
    _2_not_exist: [[3, 4], accounts[0], 5, true, 'DAPP_NOT_EXIST'],
    _3_invalid_empty_dapp_address: [[1, 2], accounts[0], -1, true, 'DAPP_ISNT_A_CONTRACT'],
    _4_not_owner: [[1, 2], accounts[5], 3, true, 'PauserRole: caller does not have the Pauser role'],
  }, function(
    previousDaapIndexes,
    caller,
    dappIndex,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('escrowFactory', 'removeDapp', 'Should be able (or not) to remove a dapp.', mustFail), async function() {
      // Setup
      for (const previousDappIndex of previousDaapIndexes) {
        await instance.addDapp(getInstance(mocks, previousDappIndex, 1), { from: owner });
      }
      const dappAddress = getInstance(mocks, dappIndex, 2);
      const initialDapps = await instance.getDapps();

      try {
        // Invocation
        const result = await instance.removeDapp(dappAddress, { from: caller });

        // Assertions
        assert(!mustFail, 'It should have failed because data is invalid.');
        assert(result);

        escrowFactory
          .dappRemoved(result)
          .emitted(caller, dappAddress);

        const finalDapps = await instance.getDapps();
        assert.equal(initialDapps.length - 1, finalDapps.length);

        const dappAddressFound = finalDapps.find(aDappAddress => aDappAddress === dappAddress);
        assert(dappAddressFound === undefined);

        const isDapp = await instance.isDapp(dappAddress);
        assert(!isDapp);
      } catch (error) {
        assert(mustFail);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});

