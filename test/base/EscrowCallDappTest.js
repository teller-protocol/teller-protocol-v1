// JS Libraries
const { withData } = require('leche')
const { t } = require('../utils/consts');
const { dappMockABI } = require('../../migrations/utils/encodeAbis');
const { createTestSettingsInstance } = require("../utils/settings-helper");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DappMock = artifacts.require("./mock/DappMock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");
const EscrowFactory = artifacts.require("./mock/base/EscrowFactoryMock.sol");

contract('EscrowCallDappTest', function (accounts) {
  const owner = accounts[0];
  let instance;
  let loans;
  let settingsInstance;
  let escrow;

  beforeEach(async () => {
    settingsInstance = await createTestSettingsInstance(Settings);
    loans = await Mock.new();
    escrow = await Escrow.new();
    instance = await EscrowFactory.new();
    await instance.initialize(settingsInstance.address, escrow.address);

    await settingsInstance.setEscrowFactory(instance.address)
  })

  withData({
    _1_not_initialized: [2, false, true, true, false, true, 'CONTRACT_NOT_INITIALIZED'],
    _2_not_borrower: [3, true, true, false, false, true, 'CALLER_NOT_BORROWER'],
    _3_without_dapp_whitelisted: [4, true, false, true, false, true, 'DAPP_NOT_WHITELISTED'],
    _4_with_invalid_function_signature: [5, true, true, true, true, true, 'DAPP_CALL_FAILED'],
    _5_successful: [6, true, true, true, false, false, null],
  }, function(
    loanID,
    initialize,
    enableDapp,
    isBorrower,
    failDapp,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('user', 'callDapp', 'Should be able (or not) to call a function on a whitelisted dapp contract', false), async function() {
      // Setup
      const dapp = await DappMock.new();
      if (initialize) {
        await escrow.mockInitialize(
          instance.address,
          settingsInstance.address,
          loans.address,
          loanID
        );
      }
      if (enableDapp) {
        await instance.addDapp(dapp.address, { from: owner });
      }
      await escrow.mockIsBorrower(true, isBorrower);

      let dappData = {
        location: dapp.address,
        data: dappMockABI.encodeTestFunction(web3, failDapp),
      };

      try {
        // Invocation
        const result = await escrow.callDapp(dappData);

        // Assertions
        assert(!mustFail);
        assert(result);
      } catch (error) {
        assert(mustFail)
        assert(error)
        assert.equal(error.reason, expectedErrorMessage)
      }
    });
  });
});
