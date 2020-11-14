// JS Libraries
const withData = require('leche').withData

const { t, NULL_ADDRESS, ACTIVE } = require('../utils/consts')
const { createLoanTerms } = require('../utils/structs')
const { loans } = require('../utils/events')
const { createLoan } = require('../utils/loans')

const Timer = require('../../scripts/utils/Timer')
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder')

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol')
const LINKMock = artifacts.require('./mock/token/LINKMock.sol')

// Smart contracts
const Loans = artifacts.require('./mock/base/TokenCollateralLoansMock.sol')

contract('TokenCollateralLoansDepositCollateralTest', function (accounts) {
  const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3)
  const timer = new Timer(web3)
  const collateralTokenOwner = accounts[9]
  let instance
  let lendingPoolInstance
  let loanTermsConsInstance
  let settingsInstance
  let atmSettingsInstance

  beforeEach('Setup for each test', async () => {
    lendingPoolInstance = await Mock.new()
    loanTermsConsInstance = await Mock.new()
    settingsInstance = await Mock.new()
    atmSettingsInstance = await Mock.new()
    instance = await Loans.new()
  })

  withData({
    _1_deposit_basic: [
      1, 1, accounts[1], accounts[1], accounts[1], 5000000, 5000000, 5000000, 0, 0, false, undefined
    ],
    _2_borrower_loan_mismatch: [
      2, 2, accounts[2], accounts[2], accounts[3], 6000000, 6000000, 6000000, 0, 0, true, 'BORROWER_LOAN_ID_MISMATCH'
    ],
    _3_deposit_zero: [
      3, 3, accounts[3], accounts[3], accounts[3], 0, 0, 0, 0, 0, true, 'CANNOT_DEPOSIT_ZERO'
    ],
    _4_deposit_more_value_not_zero: [
      4, 4, accounts[4], accounts[4], accounts[4], 5000000, 5000000, 5000000, 0, 5000000, true, 'TOKEN_LOANS_VALUE_MUST_BE_ZERO'
    ],
    _5_value_not_zero: [
      4, 4, accounts[4], accounts[4], accounts[4], 5000000, 5000000, 5000000, 5000000, 5000000, true, 'TOKEN_LOANS_VALUE_MUST_BE_ZERO'
    ]
  }, function (
    lastLoanID,
    currentLoanID,
    sender,
    loanBorrower,
    specifiedBorrower,
    currentCollateralTokenBalance,
    approveCollateralAmount,
    collateralAmount,
    currentCollateral,
    transactionValueAmount,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('user', 'depositCollateral', 'Should able (or not) to deposit tokens as collateral.', false), async function () {
      // Setup
      const collateralToken = await LINKMock.new({ from: collateralTokenOwner })
      await instance.initialize(
        lendingPoolInstance.address,
        loanTermsConsInstance.address,
        settingsInstance.address,
        collateralToken.address
      )

      const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, 0, 0, 0)
      const loan = createLoan({
        id: lastLoanID,
        loanTerms,
        collateral: currentCollateral,
        status: ACTIVE,
        borrowedAmount: loanTerms.maxLoanAmount
      });
      await instance.setLoan(loan)

      await collateralToken.mint(sender, currentCollateralTokenBalance, { from: collateralTokenOwner })
      await collateralToken.approve(instance.address, approveCollateralAmount, { from: sender })
      const initialContractCollateralTokenBalance = await collateralToken.balanceOf(instance.address)
      const initialSenderCollateralTokenBalance = await collateralToken.balanceOf(sender)
      const initialTotalCollateral = await instance.totalCollateral()

      try {
        // Invocation
        const result = await instance.depositCollateral(specifiedBorrower, currentLoanID, collateralAmount, {
          from: sender,
          value: transactionValueAmount
        })

        // Assertions
        loans
          .collateralDeposited(result)
          .emitted(currentLoanID, loanBorrower, collateralAmount)

        const finalTotalCollateral = await instance.totalCollateral()
        const finalContractCollateralTokenBalance = await collateralToken.balanceOf(instance.address)
        const finalSenderCollateralTokenBalance = await collateralToken.balanceOf(sender)

        const loanInfo = await instance.loans(currentLoanID)
        assert.equal(parseInt(loanInfo.collateral), (currentCollateral + collateralAmount))
        assert.equal(parseInt(initialTotalCollateral) + collateralAmount, parseInt(finalTotalCollateral))
        assert.equal(parseInt(initialContractCollateralTokenBalance) + collateralAmount, parseInt(finalContractCollateralTokenBalance))
        assert.equal(parseInt(initialSenderCollateralTokenBalance), parseInt(finalSenderCollateralTokenBalance) + collateralAmount)

        const txTimestamp = await timer.getCurrentTimestampInSeconds()
        assert.equal(parseInt(loanInfo.lastCollateralIn), txTimestamp)
      } catch (error) {
        assert(mustFail, error.message)
        assert.equal(error.reason, expectedErrorMessage, error.reason)
      }
    })
  })

  withData({
    _1_not_enough_allowance: [
      1, 1, accounts[1], accounts[1], accounts[1], 4500000, true, 5000000, 0, 0, true, 'NOT_ENOUGH_TOKENS_ALLOWANCE'
    ],
    _2_transferFrom_failed: [
      1, 1, accounts[1], accounts[1], accounts[1], 5000000, false, 5000000, 0, 0, true, 'TOKENS_TRANSFER_FROM_FAILED'
    ]
  }, function (
    lastLoanID,
    currentLoanID,
    sender,
    loanBorrower,
    specifiedBorrower,
    currentAllowance,
    transferFromResult,
    collateralAmount,
    currentCollateral,
    transactionValueAmount,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('user', 'depositCollateral#2', 'Should able (or not) to deposit tokens as collateral.', false), async function () {
      // Setup
      const collateralToken = await Mock.new()
      await instance.initialize(
        lendingPoolInstance.address,
        loanTermsConsInstance.address,
        settingsInstance.address,
        collateralToken.address
      )
      const encodeAllowance = erc20InterfaceEncoder.encodeAllowance()
      await collateralToken.givenMethodReturnUint(encodeAllowance, currentAllowance)
      const encodeTransferFrom = erc20InterfaceEncoder.encodeTransferFrom()
      await collateralToken.givenMethodReturnBool(encodeTransferFrom, transferFromResult)

      const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, 0, 0, 0)
      const loan = createLoan({
        id: lastLoanID,
        loanTerms,
        collateral: currentCollateral,
        status: ACTIVE,
        borrowedAmount: loanTerms.maxLoanAmount
      });
      await instance.setLoan(loan)
      const initialTotalCollateral = await instance.totalCollateral()

      try {
        // Invocation
        const result = await instance.depositCollateral(specifiedBorrower, currentLoanID, collateralAmount, {
          from: sender,
          value: transactionValueAmount
        })

        // Assertions
        loans
          .collateralDeposited(result)
          .emitted(currentLoanID, loanBorrower, collateralAmount)

        const finalTotalCollateral = await instance.totalCollateral()

        const loanInfo = await instance.loans(currentLoanID)
        assert.equal(parseInt(loanInfo.collateral), (currentCollateral + collateralAmount))
        assert.equal(parseInt(initialTotalCollateral) + collateralAmount, parseInt(finalTotalCollateral))

        const txTimestamp = await timer.getCurrentTimestampInSeconds()
        assert.equal(parseInt(loanInfo.lastCollateralIn), txTimestamp)
      } catch (error) {
        assert(mustFail, error.message)
        assert.equal(error.reason, expectedErrorMessage, error.reason)
      }
    })
  })
})