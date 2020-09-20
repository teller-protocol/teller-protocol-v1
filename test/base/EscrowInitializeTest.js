// JS Libraries
const { withData } = require('leche')
const { t } = require('../utils/consts')
const { createTestSettingsInstance } = require('../utils/settings-helper')
const LoansBaseInterfaceEncoder = require('../utils/encoders/LoansBaseInterfaceEncoder')
const { encodeLoanParameter } = require('../utils/loans')

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol')
const DappMock = artifacts.require('./mock/base/escrow/dapps/DappMock.sol')
const DAI = artifacts.require('./mock/tokens/DAIMock.sol')

// Smart contracts
const Escrow = artifacts.require('./mock/base/EscrowMock.sol')
const Settings = artifacts.require('./base/Settings.sol')

contract('EscrowInitializeTest', function (accounts) {
  const loansEncoder = new LoansBaseInterfaceEncoder(web3)

  let escrow
  let dai

  beforeEach(async () => {
    const settings = await createTestSettingsInstance(Settings, { Mock })

    escrow = await Escrow.new()
    await escrow.externalSetSettings(settings.address)

    dai = await DAI.new()
  })

  withData({
    _1_already_initialized: [ true, true, accounts[2], 1000, 1000, true, 'CONTRACT_ALREADY_INITIALIZED' ],
    _2_loans_address_not_contract: [ false, false, accounts[2], 1000, 1000, true, 'LOANS_MUST_BE_A_CONTRACT' ],
    _3_lending_token_not_received: [ false, true, accounts[2], 1000, 0, true, 'ESCROW_BALANCE_NOT_MATCH_LOAN' ],
    _4_successful: [ false, true, accounts[2], 1000, 1000, false, null ]
  }, function (
    alreadyInitialized,
    loansIsContract,
    borrower,
    borrowedAmount,
    balance,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('escrow', 'initialize', 'Should be able (or not) to initialize an Escrow contract', mustFail), async function () {
      // Setup
      let loansAddress
      if (loansIsContract) {
        const loans = await Mock.new()
        loansAddress = loans.address
        await loans.givenMethodReturn(
          loansEncoder.encodeLoans(),
          encodeLoanParameter(web3, { borrowedAmount, loanTerms: { borrower } })
        )

        await loans.givenMethodReturnAddress(
          loansEncoder.encodeLendingToken(),
          dai.address
        )
        await dai.mint(escrow.address, balance)
      } else {
        loansAddress = accounts[0]
      }

      if (alreadyInitialized) {
        await escrow.mockInitialize(loansAddress, 12345)
      }

      try {
        // Invocation
        await escrow.initialize(loansAddress, 1234)

        // Assertions
        const owner = await escrow.owner.call()
        assert.equal(borrower, owner, 'Owner not set as borrower')

        const tokens = await escrow.getTokens.call()
        assert.equal(tokens.length, 1, 'Tokens array should only have one token.')
        assert.equal(tokens[0], dai.address, 'Lending token not in tokens array.')

        assert(!mustFail)
      } catch (error) {
        assert(mustFail, error.message)
        assert(error)
        assert.equal(error.reason, expectedErrorMessage)
      }
    })
  })
})
