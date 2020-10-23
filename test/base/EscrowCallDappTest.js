// JS Libraries
const { withData } = require('leche')
const { t } = require('../utils/consts');
const { dappMockABI } = require('../../migrations/utils/encodeAbis');
const { createTestSettingsInstance } = require("../utils/settings-helper");
const EscrowFactoryEncoder = require("../utils/encoders/EscrowFactoryEncoder");
const LoansBaseInterfaceEncoder = require("../utils/encoders/LoansBaseInterfaceEncoder");
const { encodeDappConfigParameter } = require("../utils/escrow");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DappMock = artifacts.require("./mock/base/escrow/dapps/DappMock.sol");

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('EscrowCallDappTest', function (accounts) {
  const loansEncoder = new LoansBaseInterfaceEncoder(web3);
  const escrowFactoryEncoder = new EscrowFactoryEncoder(web3)

  const owner = accounts[0];
  let factory;
  let loans;
  let settings;
  let escrow;

  beforeEach(async () => {
    await createTestSettingsInstance(Settings, {
      from: owner, Mock, initialize: true, onInitialize: (instance, { escrowFactory }) => {
        settings = instance
        factory = escrowFactory
      }
    });

    loans = await Mock.new();
    escrow = await Escrow.new();
    await escrow.externalSetSettings(settings.address)
    await escrow.mockBorrower(owner);
  });

  withData({
    _1_not_initialized: [3, true, false, true, true, false, false, false, true, 'CONTRACT_NOT_INITIALIZED'],
    _2_not_owner: [3, true, true, true, true, false, false, false, true, 'Ownable: caller is not the owner'],
    _3_without_dapp_whitelisted: [4, true, true, false, true, true, false, false, true, 'DAPP_NOT_WHITELISTED'],
    _4_with_invalid_function_signature: [5, true, true, true, true, true, true, true, true, null],
    _5_loan_unsecured: [6, false, true, true, true, true, false, false, true, 'DAPP_UNSECURED_NOT_ALLOWED'],
    _5_successful: [6, true, true, true, true, true, false, false, false, null],
  }, function(
    loanID,
    loanSecured,
    initialize,
    enableDapp,
    unsecuredDapp,
    isOwner,
    failDapp,
    useInvalidSignature,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("user", "callDapp", "Should be able (or not) to call a function on a whitelisted dapp contract", mustFail), async function() {
      // Setup
      const dapp = await DappMock.new();

      await escrow.mockIsOwner(true, isOwner);
      if (initialize) {
        await escrow.mockInitialize(loans.address, loanID, { from: owner });
      }

      await loans.givenMethodReturnBool(
        loansEncoder.encodeIsLoanSecured(),
        loanSecured
      )

      await factory.givenMethodReturnBool(
        escrowFactoryEncoder.encodeIsDapp(),
        enableDapp
      )
      await factory.givenMethodReturn(
        escrowFactoryEncoder.encodeDapps(),
        encodeDappConfigParameter(web3, { exists: enableDapp, unsecured: unsecuredDapp })
      )

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
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
