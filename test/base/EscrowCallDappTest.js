// JS Libraries
const { withData } = require('leche')
const { t } = require('../utils/consts');
const { dappMockABI } = require('../../migrations/utils/encodeAbis');
const loanStatus = require("../utils/loanStatus");
const SettingsInterfaceEncoder = require("../utils/encoders/SettingsInterfaceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DappMock = artifacts.require("./mock/DappMock.sol");

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowCallDappTest', function (accounts) {
  const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
  const owner = accounts[0];
  let instance;
  let loans;
  let settingsInstance;
  let escrow;

  beforeEach(async () => {
    settingsInstance = await Mock.new();
    loans = await Mock.new();
    escrow = await Escrow.new();
    instance = await EscrowFactory.new();
    await instance.initialize(settingsInstance.address);

    await settingsInstance.givenMethodReturnAddress(
      settingsInterfaceEncoder.encodeEscrowFactory(),
      instance.address,
    );
  })

  withData({
    _1_not_borrower: [3, loanStatus.Active, true, true, false, false, false, true, 'Ownable: caller is not the owner'],
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
    it(t('user', 'callDapp', 'Should be able (or not) to call a function on a whitelisted dapp contract', false), async function() {
      // Setup
      const dapp = await DappMock.new();

      await escrow.mockBorrowerAndStatus(owner, loanStatus);
      if (initialize) {
        await escrow.initialize(
          loans.address,
          loanID
        );
      }
      await escrow.mockSettings(settingsInstance.address);

      if (enableDapp) {
        await instance.addDapp(dapp.address, { from: owner });
      }
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
        assert(mustFail)
        assert(error)
        assert.equal(error.reason, expectedErrorMessage)
      }
    });
  });
});
