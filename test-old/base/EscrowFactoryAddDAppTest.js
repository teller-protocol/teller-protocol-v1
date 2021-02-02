// JS Libraries
const withData = require('leche').withData;
const { t, createMocks, NULL_ADDRESS } = require('../utils/consts');
const { escrowFactory } = require('../utils/events');
const assert = require('assert');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowFactoryAddDappTest', function (accounts) {
  const owner = accounts[0];
  let instance;
  let mocks;

  beforeEach(async () => {
    instance = await EscrowFactory.new();
    const settings = await Settings.new();
    await settings.initialize(owner);
    await instance.initialize(settings.address, { from: owner });

    mocks = await createMocks(Mock, 10);
  })

  const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

  withData({
    _1_unsecured: [[1, 2], accounts[0], 3, true, false, null],
    _2_secured: [[1, 2], accounts[0], 3, false, false, null],
    _3_already_exist: [[3, 4], accounts[0], 4, true, true, 'DAPP_ALREADY_EXIST'],
    _4_invalid_empty_dapp_address: [[1, 2], accounts[0], -1, true, true, 'DAPP_ISNT_A_CONTRACT'],
    _5_not_pauser: [[1, 2], accounts[5], 3, true, true, 'NOT_PAUSER'],
  }, function(
    previousDaapIndexes,
    caller,
    dappIndex,
    unsecured,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('escrowFactory', 'addDapp', 'Should be able (or not) to add a new dapp.', mustFail), async function() {
      // Setup
      for (const previousDappIndex of previousDaapIndexes) {
        await instance.addDapp(getInstance(mocks, previousDappIndex, 1), unsecured, { from: owner });
      }
      const dappAddress = getInstance(mocks, dappIndex, 2);

      try {
        // Invocation
        const result = await instance.addDapp(dappAddress, unsecured, { from: caller });

        // Assertions
        assert(!mustFail, 'It should have failed because data is invalid.');
        assert(result);

        escrowFactory
          .newDappAdded(result)
          .emitted(caller, dappAddress, unsecured);

        const dapps = await instance.getDapps();
        const lastDapp = dapps[dapps.length - 1];
        assert.equal(lastDapp, dappAddress);

        const dapp = await instance.dapps.call(dappAddress);
        assert(dapp.exists);
      } catch (error) {
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
