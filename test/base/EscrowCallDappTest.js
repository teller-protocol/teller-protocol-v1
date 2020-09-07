// JS Libraries
const { withData } = require('leche')
const { t } = require('../utils/consts');
const { dappMockABI } = require('../../migrations/utils/encodeAbis');
const loanStatus = require("../utils/loanStatus");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const EscrowFactoryEncoder = require("../utils/encoders/EscrowFactoryEncoder");
const SettingsInterfaceEncoder = require("../utils/encoders/SettingsInterfaceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DappMock = artifacts.require("./mock/base/escrow/dapps/DappMock.sol");

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('EscrowCallDappTest', function (accounts) {
  const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
  const encoder = new EscrowFactoryEncoder(web3)

  const owner = accounts[0];
  let factory;
  let loans;
  let settings;
  let escrow;

  beforeEach(async () => {
    await createTestSettingsInstance(Settings, {
      from: owner, Mock, initialize: true, onInitialize: (instance, { escrowFactory, }) => {
        settings = instance
        factory = escrowFactory
      }
    });

    loans = await Mock.new();
    escrow = await Escrow.new();
    await escrow.externalSetSettings(settings.address)
  });

  withData({
    _1_not_owner: [3, loanStatus.Active, true, true, false, false, false, true, 'Ownable: caller is not the owner'],
    _2_without_dapp_whitelisted: [4, loanStatus.Active, true, false, true, false, false, true, 'DAPP_NOT_WHITELISTED'],
    _3_with_invalid_function_signature: [5, loanStatus.Active, true, true, true, true, true, true, 'DAPP_CALL_FAILED'],
    _4_successful: [6, loanStatus.Active, true, true, true, false, false, false, null],
  }, function(
    loanID,
    loanStatus,
    initialize,
    enableDapp,
    isBorrower,
    failDapp,
    useInvalidSignature,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("user", "callDapp", "Should be able (or not) to call a function on a whitelisted dapp contract", false), async function() {
      // Setup
      const dapp = await DappMock.new();

      await escrow.mockBorrowerAndStatus(owner, loanStatus);
      if (initialize) {
        await escrow.mockInitialize(loans.address, loanID, { from: owner });
      }
      await escrow.mockSettings(settings.address);

      await factory.givenMethodReturnBool(
        encoder.encodeIsDapp(),
        enableDapp
      )
      await escrow.mockIsOwner(true, isBorrower);

      let dappData = {
        location: dapp.address,
        data: useInvalidSignature ?
              dappMockABI.encodeInvalidTestFunction(web3, failDapp) : 
              dappMockABI.encodeTestFunction(web3, failDapp),
      };

      try {
        // Invocation
        const result = await escrow.callDapp(dappData, { from: owner });

        // Assertions
        assert(!mustFail);
        assert(result);
      } catch (error) {
        assert(mustFail);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
