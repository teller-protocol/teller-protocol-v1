// JS Libraries
const { withData } = require('leche')
const { t, encode } = require('../utils/consts')

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol")

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol")
const EscrowFactory = artifacts.require("./mock/base/EscrowFactoryMock.sol")

contract('EscrowCallDappTest', function (accounts) {
  let escrow
  let factory
  let dapp

  beforeEach(async () => {
    escrow = await Escrow.new()
    factory = await EscrowFactory.new(escrow.address)
    await escrow.setFactory(factory.address)
    dapp = await Mock.new()
  })

  withData({
    _1_not_initialized: [false, false, false, false, true, 'CONTRACT_NOT_INITIALIZED'],
    _2_not_borrower: [true, false, false, false, true, 'CALLER_NOT_BORROWER'],
    _3_without_dapp_whitelisted: [true, true, false, false, true, 'DAPP_NOT_WHITELISTED'],
    _4_with_invalid_function_signature: [true, true, true, false, true, null],
    _5_successful: [true, true, true, true, false, null],
  }, function(
    initialize,
    setBorrower,
    enableDapp,
    setFunction,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('user', 'callDapp', 'Should be able (or not) to call a function on a whitelisted dapp contract', false), async function() {
      try {
        if (initialize) {
          await escrow.initialize()
        }

        if (enableDapp) {
          await factory.enableDapp(dapp.address)
        }

        await escrow.setBorrower(setBorrower)

        let functionEncoding = encode(web3, 'testFunction()')
        let dappData = {
          location: dapp.address,
          data: functionEncoding
        }
        if (setFunction) {
          await dapp.givenMethodReturnBool(functionEncoding, true)
        }

        await escrow.callDapp(dappData)

        assert(!mustFail)
      } catch (error) {
        assert(mustFail)
        assert(error)
        assert.equal(error.reason, expectedErrorMessage)
      }
    });
  });
});
