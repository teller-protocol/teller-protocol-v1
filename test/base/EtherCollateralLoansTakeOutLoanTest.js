// JS Libraries
const withData = require('leche').withData
const BigNumber = require('bignumber.js')
BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: BigNumber.ROUND_FLOOR });

const { t, getLatestTimestamp, FIVE_MIN, NULL_ADDRESS, TERMS_SET, ACTIVE, TEN_THOUSAND, SECONDS_PER_YEAR_4DP } = require('../utils/consts')
const settingsNames = require('../utils/platformSettingsNames')
const { createLoanTerms } = require('../utils/structs')
const { loans } = require('../utils/events')

const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder')
const ChainlinkAggregatorEncoder = require('../utils/encoders/ChainlinkAggregatorEncoder')
const LendingPoolInterfaceEncoder = require('../utils/encoders/LendingPoolInterfaceEncoder')
const EscrowFactoryInterfaceEncoder = require('../utils/encoders/EscrowFactoryInterfaceEncoder')
const EscrowInterfaceEncoder = require('../utils/encoders/EscrowInterfaceEncoder')
const { createTestSettingsInstance } = require('../utils/settings-helper')

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol')

// Smart contracts
const Settings = artifacts.require('./base/Settings.sol')
const Loans = artifacts.require('./mock/base/EtherCollateralLoansMock.sol')
const LendingPool = artifacts.require('./base/LendingPool.sol')

contract('EtherCollateralLoansTakeOutLoanTest', function (accounts) {
  const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3)
  const chainlinkAggregatorEncoder = new ChainlinkAggregatorEncoder(web3)
  const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3)
  const escrowFactoryInterfaceEncoder = new EscrowFactoryInterfaceEncoder(web3)
  const escrowInterfaceEncoder = new EscrowInterfaceEncoder(web3)
  const owner = accounts[0]
  let instance
  let chainlinkAggregatorInstance
  let lendingPoolInstance
  let loanTermsConsInstance
  let lendingTokenInstance
  let createdEscrowMock

  const mockLoanID = 0
  const borrower = accounts[3]
  const overCollateralizedBuffer = 13000
  const collateralBuffer = 1500
  const liquidateEthPrice = 9500
  const baseNeededCollateral = overCollateralizedBuffer + collateralBuffer + (10000 - liquidateEthPrice)

  beforeEach('Setup for each test', async () => {
    lendingPoolInstance = await Mock.new()
    createdEscrowMock = await Mock.new()
    const collateralTokenInstance = await Mock.new()
    const settingsInstance = await createTestSettingsInstance(
      Settings,
      {
        from: owner,
        Mock,
        initialize: true,
        onInitialize: async (instance, { escrowFactory, chainlinkAggregator }) => {
          await escrowFactory.givenMethodReturnAddress(
            escrowFactoryInterfaceEncoder.encodeCreateEscrow(),
            createdEscrowMock.address
          )
          chainlinkAggregatorInstance = chainlinkAggregator
        }
      }, {
        [settingsNames.OverCollateralizedBuffer]: overCollateralizedBuffer,
        [settingsNames.CollateralBuffer]: collateralBuffer,
        [settingsNames.LiquidateEthPrice]: liquidateEthPrice,
      })

    loanTermsConsInstance = await Mock.new()
    instance = await Loans.new()
    await instance.initialize(
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      collateralTokenInstance.address
    )

    lendingTokenInstance = await Mock.new()
    const encodeDecimals = erc20InterfaceEncoder.encodeDecimals()
    await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, 18)
    const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken()
    await lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address)
  })

  async function setupLoan({
    recipient = NULL_ADDRESS,
    oracleValue = 0,
    maxLoanAmount = 15000000,
    termsExpired = false,
    lastCollateralIn = 0,
    collateralRatio = 0,
    loanDuration = 300000,
    interestRate = 0
  }) {
    let termsExpiry = await getLatestTimestamp() + FIVE_MIN
    if (termsExpired) termsExpiry -= FIVE_MIN * 2

    // encode current token price
    await chainlinkAggregatorInstance.givenMethodReturnUint(
      chainlinkAggregatorEncoder.encodeValueFor(),
      oracleValue.toString()
    )

    const loanTerms = createLoanTerms(borrower, recipient, interestRate, collateralRatio, maxLoanAmount, loanDuration)
    await instance.setLoan(mockLoanID, loanTerms, termsExpiry, 0, 0, lastCollateralIn, 0, 0, 0, TERMS_SET, false)

    return async function afterAssert(tx) {
      const loan = await instance.loans(mockLoanID)

      assert(loan.borrowedAmount.gt(0), "Borrowed amount invalid")

      const interestOwed = new BigNumber(loan.borrowedAmount.toString())
        .multipliedBy(interestRate)
        .multipliedBy(loanDuration)
        .div(TEN_THOUSAND)
        .div(SECONDS_PER_YEAR_4DP)
        .toFixed(0)
      assert.equal(loan.interestOwed.toString(), interestOwed, "Loan interest owed invalid")

      const txTime = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp
      assert.equal(loan.loanStartTime.toString(), txTime, "Loan start time invalid")

      assert.equal(loan.status.toString(), ACTIVE, "Loan not active")

      loans
        .loanTakenOut(tx)
        .emitted(mockLoanID, borrower, loan.escrow, loan.borrowedAmount)

      return loan
    }
  }

  withData({
    _1_max_loan_exceeded: [ 15000001, 15000000, false, false, 0, 'MAX_LOAN_EXCEEDED' ],
    _2_loan_terms_expired: [ 15000000, 15000000, true, false, 0, 'LOAN_TERMS_EXPIRED' ],
    _3_collateral_deposited_recently: [ 15000000, 15000000, false, true, 0, 'COLLATERAL_DEPOSITED_RECENTLY' ],
    _4_more_collateral_needed: [ 15000000, 15000000, false, false, 45158, 'MORE_COLLATERAL_REQUIRED' ]
  }, function (
    amountToBorrow,
    maxLoanAmount,
    termsExpired,
    collateralTooRecent,
    oracleValue,
    expectedErrorMessage
  ) {
    it(t('user', 'takeOutLoan#1', 'Should not able to take out a loan.', true), async function () {
      // Setup
      const timeNow = parseInt((await getLatestTimestamp()).toString())

      let lastCollateralIn = timeNow - FIVE_MIN
      if (collateralTooRecent) {
        lastCollateralIn += FIVE_MIN
      }

      const afterAssert = await setupLoan({
        oracleValue,
        maxLoanAmount,
        termsExpired,
        lastCollateralIn
      })

      try {
        // Invocation
        const tx = await instance.takeOutLoan(mockLoanID, amountToBorrow, { from: borrower })
        const loan = await afterAssert(tx)
        console.log(loan)
      } catch (error) {
        assert.equal(error.reason, expectedErrorMessage, error.message)
      }
    })
  })

  withData({
    // with no interest this loan will have the exact minimum collateral ratio required for EOA loan
    _1_base_collateral_needed_no_interest: [ 15000000, baseNeededCollateral, 0, true ],
    // with interest this loan will have more than minimum collateral ratio required for EOA loan
    _2_base_collateral_needed_with_interest: [ 15000000, baseNeededCollateral, 1, false ],
    _3_low_collateral_no_interest: [ 15000000, baseNeededCollateral / 2, 0, true ],
    // with interest this loan will have less than minimum collateral ratio required for EOA loan
    _4_less_than_base_collateral: [ 15000000, baseNeededCollateral - 1, 0, true ],
    // with interest this loan will have less than minimum collateral ratio with the same amount of interest resulting in minimum required for EOA loan
    _5_less_than_base_collateral_with_interest: [ 15000000, baseNeededCollateral - 2, 2, true ],
    _6_less_than_base_collateral_with_interest: [ 15000000, baseNeededCollateral - 2, 5, true ],
  }, function (
    amountToBorrow,
    collateralRatio,
    interestRate,
    shouldFail
  ) {
    it(t('user', 'takeOutLoan#2', 'Should able to take out an under collateralized loan with an Escrow contract.', shouldFail), async function () {
      // Setup
      const afterAssertFn = await setupLoan({
        maxLoanAmount: amountToBorrow,
        collateralRatio,
        interestRate
      })

      // Invocation
      try {
        const tx = await instance.takeOutLoan(mockLoanID, amountToBorrow, { from: borrower })

        // Assertions
        const loan = await afterAssertFn(tx)

        assert.notEqual(loan.escrow.toString(), NULL_ADDRESS, "Escrow contract was not created")
        const count = await createdEscrowMock.invocationCountForMethod.call(escrowInterfaceEncoder.encodeInitialize())
        assert.equal(count.toString(), '1', 'Escrow initializer was not called')

        const pool = await LendingPool.at(lendingPoolInstance.address)
        const createLoanCallData = pool.contract.methods.createLoan(amountToBorrow.toString(), loan.escrow.toString()).encodeABI()
        const createLoanCallCount = await lendingPoolInstance.invocationCountForCalldata.call(createLoanCallData)
        assert.equal(createLoanCallCount.toString(), '1', 'Lending pool not called to create loan with escrow address')

        assert(!shouldFail)
      } catch (err) {
        assert(shouldFail, err.message)
      }
    })
  })

  withData({
    _1_borrower_account: [ NULL_ADDRESS, 15000000, baseNeededCollateral ],
    _2_recipient_account: [ accounts[2], 15000000, baseNeededCollateral ],
  }, function (
    recipient,
    amountToBorrow,
    collateralRatio
  ) {
    it(t('user', 'takeOutLoan#3', 'Should able to take out an over collateralized loan with to their own wallet.', false), async function () {
      // Setup
      const afterAssertFn = await setupLoan({
        recipient,
        maxLoanAmount: amountToBorrow,
        collateralRatio
      })

      // Invocation
      const tx = await instance.takeOutLoan(mockLoanID, amountToBorrow, { from: borrower })

      // Assertions
      const loan = await afterAssertFn(tx)
      assert(loan.escrow.toString() === NULL_ADDRESS, "Escrow contract was created")
    })
  })
})