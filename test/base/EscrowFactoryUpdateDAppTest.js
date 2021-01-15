// JS Libraries
const withData = require('leche').withData;
const { t, createMocks, NULL_ADDRESS } = require('../utils/consts');
const { escrowFactory } = require('../utils/events');
const assert = require('assert');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');

// Smart contracts
const Settings = artifacts.require('./base/Settings.sol');
const EscrowFactory = artifacts.require('./base/EscrowFactory.sol');

contract('EscrowFactoryUpdateDappTest', function (accounts) {
  const owner = accounts[0];
  let instance;
  let mocks;

  beforeEach(async () => {
    instance = await EscrowFactory.new();
    const settings = await Settings.new();
    await settings.initialize(owner);
    await instance.initialize(settings.address, { from: owner });

    mocks = await createMocks(Mock, 10);
  });

  withData(
    {
      _1_to_unsecured: [owner, true, true, false, null],
      _2_to_secured: [owner, true, false, false, null],
      _3_not_exist: [owner, false, true, true, 'DAPP_NOT_EXIST'],
      _4_not_pauser: [accounts[5], true, true, true, 'NOT_PAUSER'],
    },
    function (caller, exists, toUnsecured, mustFail, expectedErrorMessage) {
      it(
        t(
          'escrowFactory',
          'updateDapp',
          'Should be able (or not) to update an existing dapp.',
          mustFail
        ),
        async function () {
          // Setup
          const dapp = await Mock.new();
          if (exists) {
            await instance.addDapp(dapp.address, !toUnsecured, { from: owner });
          }

          try {
            // Invocation
            const result = await instance.updateDapp(dapp.address, toUnsecured, {
              from: caller,
            });

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);

            escrowFactory.dappUpdated(result).emitted(caller, dapp.address, toUnsecured);
          } catch (error) {
            assert(mustFail, error.message);
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );
});
