const Loans = artifacts.require('Loans')
const Mock = artifacts.require('Mock')
const EtherUsdAggregator = artifacts.require('EtherUsdAggregator')
const LendingPoolMock = artifacts.require('LendingPoolMock');

const assert = require('assert')
const time = require('ganache-time-traveler')
const truffleAssert = require('truffle-assertions')

const {
  NULL_ADDRESS,
  ONE_HOUR,
  ONE_DAY,
  getLatestTimestamp
} = require('../utils/consts');
const { hashLoan, signLoanHash } = require('../utils/hashes');


contract('Loans Unit Tests', async accounts => {
  const signerAddress = accounts[0]
  const attackerAddress = accounts[1]
  const aliceAddress = accounts[2]
  const bobAddress = accounts[3]

  // some default loan values for the tests
  const INTEREST_RATE = 700
  const COLLATERAL_RATIO = 6000
  const MAX_LOAN_AMOUNT = 10000
  const NUMBER_DAYS = 30

  let mockOracle
  let mockOracleInterface
  let lendingPoolMock
  let lendingPoolMockInterface

  let mockOracleTimestamp
  let mockOracleValue

  let loans

  beforeEach(async () => {
    const snapShot = await time.takeSnapshot()
    snapshotId = snapShot['result']
  })

  afterEach(async () => {
    await time.revertToSnapshot(snapshotId)
  })

  async function setupMockContracts() {
    mockOracle = await Mock.new()
    lendingPoolMock = await Mock.new()

    mockOracleInterface = await EtherUsdAggregator.new(accounts[1])
    lendingPoolMockInterface = await LendingPoolMock.new()

    mockOracleTimestamp = await mockOracleInterface.contract.methods
    .getLatestTimestamp()
    .encodeABI()
    mockOracleValue = await mockOracleInterface.contract.methods
    .getLatestAnswer()
    .encodeABI()
  }

  before('Deploy Loans Contract', async () => {
    await setupMockContracts()
    loans = await Loans.new(
      mockOracle.address,
      lendingPoolMock.address
    )
  })

  describe('Test the constructor', async () => {
    it('should set the addresses of the oracle and pool', async () => {
      let result = await loans.priceOracle.call()
      assert.equal(result, mockOracle.address, 'Oracle address not set correctly')
      
      result = await loans.lendingPool.call()
      assert.equal(result, lendingPoolMock.address, 'DAI Pool address not set correctly')
    })

    it('should not accept an oracle address of 0', async () => {
      await truffleAssert.reverts(
        Loans.new(
          NULL_ADDRESS,
          lendingPoolMock.address
        ),
        'PROVIDE_ORACLE_ADDRESS'
      )
    })

    it('should not accept a dai pool address of 0', async () => {
      await truffleAssert.reverts(
        Loans.new(
          mockOracle.address,
          NULL_ADDRESS
        ),
        'PROVIDE_LENDINGPOOL_ADDRESS'
      )
    })
  })

  describe('Test takeOutLoan()', async () => {
    let hashedLoan = hashLoan({
      interestRate: INTEREST_RATE,        // 700 -> 7.00%
      collateralRatio: COLLATERAL_RATIO,    // 6000 -> 60.00%
      borrower: aliceAddress,
      maxLoanAmount: MAX_LOAN_AMOUNT,
      numberDays: NUMBER_DAYS,
      signerNonce: 0,
    })

    it('should not allow a borrow amount larger than the max', async () => {
      const signature = await signLoanHash(web3, signerAddress, hashedLoan)

      await truffleAssert.reverts(
        loans.takeOutLoan(
          INTEREST_RATE,
          COLLATERAL_RATIO,
          MAX_LOAN_AMOUNT,
          NUMBER_DAYS,
          MAX_LOAN_AMOUNT+1,  // amount to borrow is larger than the maximum
          {
            signerNonce: 0,
            v: signature.v,
            r: signature.r,
            s: signature.s
          },
          { from: aliceAddress }
        ),
        'BORROW_AMOUNT_NOT_AUTHORIZED'
      )
    })

    it('should not allow a non-signer to sign a loan', async () => {
      // signed by an attacker
      const signature = await signLoanHash(web3, attackerAddress, hashedLoan)

      // reverts as the signer was not authorized
      await truffleAssert.reverts(
        loans.takeOutLoan(
          INTEREST_RATE,
          COLLATERAL_RATIO,
          MAX_LOAN_AMOUNT,
          NUMBER_DAYS,
          MAX_LOAN_AMOUNT,  // amount to borrow now within the allowances
          {
            signerNonce: 0,
            v: signature.v,
            r: signature.r,
            s: signature.s
          },
          { from: aliceAddress }
        ),
        'SIGNER_NOT_AUTHORIZED'
      )
    })

    it('should not proceed if the oracle is outdated', async () => {
      // mock the oracle returning an old timestamp
      const nintyMinsAgo = (await getLatestTimestamp()) - (1.5 * ONE_HOUR)

      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, nintyMinsAgo)

      const signature = await signLoanHash(web3, signerAddress, hashedLoan)

      await truffleAssert.reverts(
        loans.takeOutLoan(
          INTEREST_RATE,
          COLLATERAL_RATIO,
          MAX_LOAN_AMOUNT,
          NUMBER_DAYS,
          MAX_LOAN_AMOUNT,  // amount to borrow now within the allowances
          {
            signerNonce: 0,
            v: signature.v,
            r: signature.r,
            s: signature.s
          },
          { from: aliceAddress }
        ),
        'ORACLE_PRICE_OLD'
      )
    })

    it('should not proceed if not enough collateral has been provided', async () => {
      // mock the oracle returning a new timestamp
      const fortyFiveMinsAgo = (await getLatestTimestamp()) - (0.75 * ONE_HOUR)
      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, fortyFiveMinsAgo)

      // ETH/DAI price of 199
      await mockOracle.givenMethodReturnUint(mockOracleValue, 199)

      const signature = await signLoanHash(web3, signerAddress, hashedLoan)

      // 6000 DAI in value is required as collateral
      // Alice sends 30 ETH in, with an ETH price of 199 DAI => 5970 DAI in value
      await truffleAssert.reverts(
        loans.takeOutLoan(
          INTEREST_RATE,
          COLLATERAL_RATIO,
          MAX_LOAN_AMOUNT,
          NUMBER_DAYS,
          MAX_LOAN_AMOUNT,
          {
            signerNonce: 0,
            v: signature.v,
            r: signature.r,
            s: signature.s
          },
          {
            from: aliceAddress,
            value: 30
          }
        ),
        'MORE_COLLATERAL_REQUIRED'
      )
    })

    it('should successfully create a loan for valid parameters and signature', async () => {
      // mock the oracle returning a new timestamp
      const fortyFiveMinsAgo = (await getLatestTimestamp()) - (0.75 * ONE_HOUR)
      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, fortyFiveMinsAgo)

      // ETH/DAI price of 205 this time - therefore 30 ETH is enough collateral
      await mockOracle.givenMethodReturnUint(mockOracleValue, 205)

      const signature = await signLoanHash(web3, signerAddress, hashedLoan)

      // 6000 DAI in value is required as collateral
      // Alice sends 30 ETH in, with an ETH price of 205 DAI => 6150 DAI in value
      let result = await loans.takeOutLoan(
          INTEREST_RATE,
          COLLATERAL_RATIO,
          MAX_LOAN_AMOUNT,
          NUMBER_DAYS,
          MAX_LOAN_AMOUNT,
          {
            signerNonce: 0,
            v: signature.v,
            r: signature.r,
            s: signature.s
          },
          {
            from: aliceAddress,
            value: 30
          }
      )

      truffleAssert.eventEmitted(result, 'LoanCreated', event => {
        return (
          event.loanID.toNumber() === 0 &&
          event.borrower === aliceAddress &&
          event.interestRate.toNumber() === INTEREST_RATE &&
          event.collateralRatio.toNumber() === COLLATERAL_RATIO &&
          event.maxLoanAmount.toNumber() === MAX_LOAN_AMOUNT &&
          event.numberDays.toNumber() === NUMBER_DAYS
        )
      })

      // check the loan ID counter updated properly
      let nextLoanID = await loans.loanIDCounter.call()
      assert.equal(nextLoanID, 1, 'Loan counter was not updated')

      // check the borrower's loan has been stored
      let alicesLoans = await loans.getBorrowerLoans(aliceAddress)

      assert.equal(alicesLoans.length, 1, 'Alice has incorrect number of loans')
      assert.equal(alicesLoans[0], 0, 'Alices loan ID incorrect')

      // check the loan was stored in the mapping of all loans
      let loan = await loans.loans.call(0)
      let loanTimestamp = (await web3.eth.getBlock(result.receipt.blockNumber)).timestamp
      assert.equal(loan['id'], 0, 'Loan ID incorrect')
      assert.equal(loan['collateral'], 30, 'collateral incorrect')
      assert.equal(loan['maxLoanAmount'], MAX_LOAN_AMOUNT, 'maxLoanAmount incorrect')
      assert.equal(loan['totalOwed'], 10057, 'totalOwed incorrect')    // 10000 DAI plus 7% annual interest for 30 days
      assert.equal(loan['timeStart'], loanTimestamp, 'timeStart incorrect')
      assert.equal(loan['timeEnd'], loanTimestamp+(ONE_DAY*NUMBER_DAYS), 'timeEnd incorrect')
      assert.equal(loan['borrower'], aliceAddress, 'borrower incorrect')
      assert.equal(loan['active'], true, 'borrower incorrect')
      assert.equal(loan['liquidated'], false, 'borrower incorrect')
    })

    it('should successfully create a loan for valid parameters and signature', async () => {
      // mock the oracle returning a new timestamp
      const fortyFiveMinsAgo = (await getLatestTimestamp()) - (0.75 * ONE_HOUR)
      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, fortyFiveMinsAgo)

      // ETH/DAI price of 205 this time - therefore 30 ETH is enough collateral
      await mockOracle.givenMethodReturnUint(mockOracleValue, 205)

      const signature = await signLoanHash(web3, signerAddress, hashedLoan)

      // 6000 DAI in value is required as collateral
      // Alice sends 30 ETH in, with an ETH price of 205 DAI => 6150 DAI in value
      let result = await loans.takeOutLoan(
          INTEREST_RATE,
          COLLATERAL_RATIO,
          MAX_LOAN_AMOUNT,
          NUMBER_DAYS,
          MAX_LOAN_AMOUNT,
          {
            signerNonce: 0,
            v: signature.v,
            r: signature.r,
            s: signature.s
          },
          {
            from: aliceAddress,
            value: 30
          }
      )

      truffleAssert.eventEmitted(result, 'LoanCreated', event => {
        return (
          event.loanID.toNumber() === 0 &&
          event.borrower === aliceAddress &&
          event.interestRate.toNumber() === INTEREST_RATE &&
          event.collateralRatio.toNumber() === COLLATERAL_RATIO &&
          event.maxLoanAmount.toNumber() === MAX_LOAN_AMOUNT &&
          event.numberDays.toNumber() === NUMBER_DAYS
        )
      })

      // check the loan ID counter updated properly
      let nextLoanID = await loans.loanIDCounter.call()
      assert.equal(nextLoanID, 1, 'Loan counter was not updated')

      // check the borrower's loan has been stored
      let alicesLoans = await loans.getBorrowerLoans(aliceAddress)

      assert.equal(alicesLoans.length, 1, 'Alice has incorrect number of loans')
      assert.equal(alicesLoans[0], 0, 'Alices loan ID incorrect')

      // check the loan was stored in the mapping of all loans
      let loan = await loans.loans.call(0)
      let loanTimestamp = (await web3.eth.getBlock(result.receipt.blockNumber)).timestamp
      assert.equal(loan['id'], 0, 'Loan ID incorrect')
      assert.equal(loan['collateral'], 30, 'collateral incorrect')
      assert.equal(loan['maxLoanAmount'], MAX_LOAN_AMOUNT, 'maxLoanAmount incorrect')
      assert.equal(loan['totalOwed'], 10057, 'totalOwed incorrect')    // 10000 DAI plus 7% annual interest for 30 days
      assert.equal(loan['timeStart'], loanTimestamp, 'timeStart incorrect')
      assert.equal(loan['timeEnd'], loanTimestamp+(ONE_HOUR*24*NUMBER_DAYS), 'timeEnd incorrect')
      assert.equal(loan['borrower'], aliceAddress, 'borrower incorrect')
      assert.equal(loan['active'], true, 'borrower incorrect')
      assert.equal(loan['liquidated'], false, 'borrower incorrect')
    })

    it('should successfully create a loan for valid parameters and signature', async () => {
      // mock the oracle returning a new timestamp
      const fortyFiveMinsAgo = (await getLatestTimestamp()) - (0.75 * ONE_HOUR)
      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, fortyFiveMinsAgo)

      // ETH/DAI price of 205 this time - therefore 30 ETH is enough collateral
      await mockOracle.givenMethodReturnUint(mockOracleValue, 205)

      const signature = await signLoanHash(web3, signerAddress, hashedLoan)

      // 6000 DAI in value is required as collateral
      // Alice sends 30 ETH in, with an ETH price of 205 DAI => 6150 DAI in value
      let result = await loans.takeOutLoan(
          INTEREST_RATE,
          COLLATERAL_RATIO,
          MAX_LOAN_AMOUNT,
          NUMBER_DAYS,
          MAX_LOAN_AMOUNT,
          {
            signerNonce: 0,
            v: signature.v,
            r: signature.r,
            s: signature.s
          },
          {
            from: aliceAddress,
            value: 30
          }
      )

      truffleAssert.eventEmitted(result, 'LoanCreated', event => {
        return (
          event.loanID.toNumber() === 0 &&
          event.borrower === aliceAddress &&
          event.interestRate.toNumber() === INTEREST_RATE &&
          event.collateralRatio.toNumber() === COLLATERAL_RATIO &&
          event.maxLoanAmount.toNumber() === MAX_LOAN_AMOUNT &&
          event.numberDays.toNumber() === NUMBER_DAYS
        )
      })

      // check the loan ID counter updated properly
      let nextLoanID = await loans.loanIDCounter.call()
      assert.equal(nextLoanID, 1, 'Loan counter was not updated')

      // check the borrower's loan has been stored
      let alicesLoans = await loans.getBorrowerLoans(aliceAddress)

      assert.equal(alicesLoans.length, 1, 'Alice has incorrect number of loans')
      assert.equal(alicesLoans[0], 0, 'Alices loan ID incorrect')

      // check the loan was stored in the mapping of all loans
      let loan = await loans.loans.call(0)
      let loanTimestamp = (await web3.eth.getBlock(result.receipt.blockNumber)).timestamp
      assert.equal(loan['id'], 0, 'Loan ID incorrect')
      assert.equal(loan['collateral'], 30, 'collateral incorrect')
      assert.equal(loan['maxLoanAmount'], MAX_LOAN_AMOUNT, 'maxLoanAmount incorrect')
      assert.equal(loan['totalOwed'], 10057, 'totalOwed incorrect')    // 10000 DAI plus 7% annual interest for 30 days
      assert.equal(loan['timeStart'], loanTimestamp, 'timeStart incorrect')
      assert.equal(loan['timeEnd'], loanTimestamp+(ONE_HOUR*24*NUMBER_DAYS), 'timeEnd incorrect')
      assert.equal(loan['borrower'], aliceAddress, 'borrower incorrect')
      assert.equal(loan['active'], true, 'borrower incorrect')
      assert.equal(loan['liquidated'], false, 'borrower incorrect')

      const callCount = await lendingPoolMock.invocationCountForMethod.call(
        lendingPoolMockInterface.contract.methods.createLoan(0, NULL_ADDRESS).encodeABI()
      )
      assert.equal(
        callCount,
        1,
        'create loan not called once'
      )
    })

    it('should not allow a repeated signer nonce', async () => {
      // mock the oracle returning a new timestamp
      const fortyFiveMinsAgo = (await getLatestTimestamp()) - (0.75 * ONE_HOUR)
      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, fortyFiveMinsAgo)

      // ETH/DAI price of 205 this time - therefore 30 ETH is enough collateral
      await mockOracle.givenMethodReturnUint(mockOracleValue, 205)

      const signature = await signLoanHash(web3, signerAddress, hashedLoan)

      // 6000 DAI in value is required as collateral
      // Alice sends 30 ETH in, with an ETH price of 205 DAI => 6150 DAI in value
      let result = await loans.takeOutLoan(
          INTEREST_RATE,
          COLLATERAL_RATIO,
          MAX_LOAN_AMOUNT,
          NUMBER_DAYS,
          MAX_LOAN_AMOUNT,
          {
            signerNonce: 0,
            v: signature.v,
            r: signature.r,
            s: signature.s
          },
          {
            from: aliceAddress,
            value: 30
          }
      )

      truffleAssert.eventEmitted(result, 'LoanCreated')

      // now alice tries and take out a loan with the same signature to get double
      await truffleAssert.reverts(
        loans.takeOutLoan(
          INTEREST_RATE,
          COLLATERAL_RATIO,
          MAX_LOAN_AMOUNT,
          NUMBER_DAYS,
          MAX_LOAN_AMOUNT,
          {
            signerNonce: 0,
            v: signature.v,
            r: signature.r,
            s: signature.s
          },
          {
            from: aliceAddress,
            value: 30
          }
        ),
        'SIGNER_NONCE_TAKEN'
      )
    })

    it('should take out more loans for the same and different users', async () => {
      // mock the oracle returning a new timestamp
      const fortyFiveMinsAgo = (await getLatestTimestamp()) - (0.75 * ONE_HOUR)
      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, fortyFiveMinsAgo)

      // ETH/DAI price of 205 this time - therefore 30 ETH is enough collateral
      await mockOracle.givenMethodReturnUint(mockOracleValue, 205)

      let signature = await signLoanHash(web3, signerAddress, hashedLoan)

      // 6000 DAI in value is required as collateral
      // Alice sends 30 ETH in, with an ETH price of 205 DAI => 6150 DAI in value
      let result = await loans.takeOutLoan(
          INTEREST_RATE,
          COLLATERAL_RATIO,
          MAX_LOAN_AMOUNT,
          NUMBER_DAYS,
          MAX_LOAN_AMOUNT,
          {
            signerNonce: 0,
            v: signature.v,
            r: signature.r,
            s: signature.s
          },
          {
            from: aliceAddress,
            value: 30
          }
      )

      truffleAssert.eventEmitted(result, 'LoanCreated')

      hashedLoan = hashLoan({
        interestRate: INTEREST_RATE,        // 700 -> 7.00%
        collateralRatio: COLLATERAL_RATIO,    // 6000 -> 60.00%
        borrower: bobAddress,
        maxLoanAmount: MAX_LOAN_AMOUNT,
        numberDays: NUMBER_DAYS,
        signerNonce: 1,
      })

      signature = await signLoanHash(web3, signerAddress, hashedLoan)

      // now bob takes out a loan
      result = await loans.takeOutLoan(
        INTEREST_RATE,
        COLLATERAL_RATIO,
        MAX_LOAN_AMOUNT,
        NUMBER_DAYS,
        6000,
        {
          signerNonce: 1,
          v: signature.v,
          r: signature.r,
          s: signature.s
        },
        {
          from: bobAddress,
          value: 21
        }
      )    
      truffleAssert.eventEmitted(result, 'LoanCreated')

      // now Alice takes out another loan
      hashedLoan = hashLoan({
        interestRate: INTEREST_RATE,        // 700 -> 7.00%
        collateralRatio: COLLATERAL_RATIO,    // 6000 -> 60.00%
        borrower: aliceAddress,
        maxLoanAmount: MAX_LOAN_AMOUNT,
        numberDays: NUMBER_DAYS,
        signerNonce: 2,
      })

      signature = await signLoanHash(web3, signerAddress, hashedLoan)

      // now bob takes out a loan
      result = await loans.takeOutLoan(
        INTEREST_RATE,
        COLLATERAL_RATIO,
        MAX_LOAN_AMOUNT,
        NUMBER_DAYS,
        7700,
        {
          signerNonce: 2,
          v: signature.v,
          r: signature.r,
          s: signature.s
        },
        {
          from: aliceAddress,
          value: 25
        }
      )    
      truffleAssert.eventEmitted(result, 'LoanCreated')

    })
  })

  describe('Test depositCollateral()', async () => {
    beforeEach(async () => {
      const fortyFiveMinsAgo = (await getLatestTimestamp()) - (0.75 * ONE_HOUR)
      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, fortyFiveMinsAgo)

      // ETH/DAI price of 205 this time - therefore 30 ETH is enough collateral
      await mockOracle.givenMethodReturnUint(mockOracleValue, 205)

      // create a loan for alice with ID 0
      let hashedLoan = hashLoan({
        interestRate: INTEREST_RATE,        // 700 -> 7.00%
        collateralRatio: COLLATERAL_RATIO,    // 6000 -> 60.00%
        borrower: aliceAddress,
        maxLoanAmount: MAX_LOAN_AMOUNT,
        numberDays: NUMBER_DAYS,
        signerNonce: 0,
      })
      signature = await signLoanHash(web3, signerAddress, hashedLoan)

      await loans.takeOutLoan(
        INTEREST_RATE,
        COLLATERAL_RATIO,
        MAX_LOAN_AMOUNT,
        NUMBER_DAYS,
        MAX_LOAN_AMOUNT,
        {
          signerNonce: 0,
          v: signature.v,
          r: signature.r,
          s: signature.s
        },
        {
          from: aliceAddress,
          value: 30
        }
      )
    })

    it('should not succeed for a non-existent loan', async () => {
      await truffleAssert.reverts(
        loans.depositCollateral(
          aliceAddress,
          1
        ),
        'LOAN_ID_INVALID'
      )
  
    })

    it('should not succeed if the borrower is incorrect', async () => {
      await truffleAssert.reverts(
        loans.depositCollateral(
          bobAddress,   // this is not bob's loan
          0
        ),
        'BORROWER_LOAN_ID_MISMATCH'
      )
    })

    it('should not succeed and increase collateral in the loan', async () => {
      let collateralInLoan = (await loans.loans.call(0)).collateral
      assert.equal(collateralInLoan, 30, 'incorrect amount of collateral in loan')

      let result = await loans.depositCollateral(
        aliceAddress,   // this is not bob's loan
        0,
        { value: 1 }
      )

      truffleAssert.eventEmitted(result, 'CollateralDeposited')

      collateralInLoan = (await loans.loans.call(0)).collateral
      assert.equal(collateralInLoan, 31, 'collateral in loan did not increase')

    })
  })

  describe('Test withdrawCollateral()', async () => {
    beforeEach(async () => {
      // setup a loan for Alice
      const fortyFiveMinsAgo = (await getLatestTimestamp()) - (0.75 * ONE_HOUR)
      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, fortyFiveMinsAgo)

      // ETH/DAI price of 205 this time - therefore 30 ETH is enough collateral
      await mockOracle.givenMethodReturnUint(mockOracleValue, 200)

      // create a loan for alice with ID 0
      let hashedLoan = hashLoan({
        interestRate: INTEREST_RATE,        // 700 -> 7.00%
        collateralRatio: COLLATERAL_RATIO,    // 6000 -> 60.00%
        borrower: aliceAddress,
        maxLoanAmount: MAX_LOAN_AMOUNT,
        numberDays: NUMBER_DAYS,
        signerNonce: 0,
      })
      signature = await signLoanHash(web3, signerAddress, hashedLoan)

      await loans.takeOutLoan(
        INTEREST_RATE,
        COLLATERAL_RATIO,
        MAX_LOAN_AMOUNT,
        NUMBER_DAYS,
        MAX_LOAN_AMOUNT,
        {
          signerNonce: 0,
          v: signature.v,
          r: signature.r,
          s: signature.s
        },
        {
          from: aliceAddress,
          value: 35
        }
      )
    })

    it('should not succeed for a non-existent loan', async () => {
      await truffleAssert.reverts(
        loans.withdrawCollateral(
          5,
          1
        ),
        'LOAN_ID_INVALID'
      )
    })

    it('should not succeed if the caller doesnt own the loan', async () => {
      await truffleAssert.reverts(
        loans.withdrawCollateral(
          5,
          0,
          { from: attackerAddress }
        ),
        'CALLER_DOESNT_OWN_LOAN'
      )
    })

    it('should not pay out the full request if the loan would be under collateralised', async () => {
      let collateralInLoan = (await loans.loans.call(0)).collateral
      assert.equal(collateralInLoan, 35, 'incorrect amount of collateral in loan')

      let contractBefore = await web3.eth.getBalance(loans.address)
      let totalCollBefore = await loans.totalCollateral.call()

      // minimum collateralisation is 6000 DAI worth, so 30 ETH
      // this means that the maximum that can be withdrawn is 5 ETH
      // Alice requests to withdraw 6 ETH

      let result = await loans.withdrawCollateral(
        6,   // this is not bob's loan
        0,
        { from: aliceAddress }
      )

      truffleAssert.eventEmitted(result, 'CollateralWithdrawn')

      let contractAfter = await web3.eth.getBalance(loans.address)
      let totalCollAfter = await loans.totalCollateral.call()

      assert.equal(contractBefore - 5, contractAfter, 'The contract balance is incorrect')
      assert.equal(totalCollBefore - 5, totalCollAfter, 'Total collateral is not correct')

      collateralInLoan = (await loans.loans.call(0)).collateral
      assert.equal(collateralInLoan, 30, 'collateral in loan did not decrease correctly')
    })

    it('should pay out the full request if it doesnt cause undercollateralisation', async () => {
      let collateralInLoan = (await loans.loans.call(0)).collateral
      assert.equal(collateralInLoan, 35, 'incorrect amount of collateral in loan')

      let contractBefore = await web3.eth.getBalance(loans.address)
      let totalCollBefore = await loans.totalCollateral.call()

      // minimum collateralisation is 6000 DAI worth, so 30 ETH
      // this means that the maximum that can be withdrawn is 5 ETH
      // Alice requests to withdraw 3 ETH

      let result = await loans.withdrawCollateral(
        3,   // this is not bob's loan
        0,
        { from: aliceAddress }
      )

      truffleAssert.eventEmitted(result, 'CollateralWithdrawn')

      let contractAfter = await web3.eth.getBalance(loans.address)
      let totalCollAfter = await loans.totalCollateral.call()

      assert.equal(contractBefore - 3, contractAfter, 'The contract balance is incorrect')
      assert.equal(totalCollBefore - 3, totalCollAfter, 'Total collateral is not correct')

      collateralInLoan = (await loans.loans.call(0)).collateral
      assert.equal(collateralInLoan, 32, 'collateral in loan did not decrease correctly')
    })
  })

  describe('Test repay()', async () => {
    beforeEach(async () => {
      // setup a loan for Alice
      const fortyFiveMinsAgo = (await getLatestTimestamp()) - (0.75 * ONE_HOUR)
      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, fortyFiveMinsAgo)

      // ETH/DAI price of 205 this time - therefore 30 ETH is enough collateral
      await mockOracle.givenMethodReturnUint(mockOracleValue, 200)

      // create a loan for alice with ID 0
      let hashedLoan = hashLoan({
        interestRate: INTEREST_RATE,        // 700 -> 7.00%
        collateralRatio: COLLATERAL_RATIO,    // 6000 -> 60.00%
        borrower: aliceAddress,
        maxLoanAmount: MAX_LOAN_AMOUNT,
        numberDays: NUMBER_DAYS,
        signerNonce: 0,
      })
      signature = await signLoanHash(web3, signerAddress, hashedLoan)

      await loans.takeOutLoan(
        INTEREST_RATE,
        COLLATERAL_RATIO,
        MAX_LOAN_AMOUNT,
        NUMBER_DAYS,
        MAX_LOAN_AMOUNT,
        {
          signerNonce: 0,
          v: signature.v,
          r: signature.r,
          s: signature.s
        },
        {
          from: aliceAddress,
          value: 35
        }
      )
    })

    it('should not succeed for a non-existent loan', async () => {
      await truffleAssert.reverts(
        loans.repay(
          1000,
          1
        ),
        'LOAN_ID_INVALID'
      )
    })

    it('should accept a payment less than the full loan amount and update the loan', async () => {
      // fetch the loan
      let loan = await loans.loans.call(0)
      let amountOwedBefore = loan['totalOwed']
      let activeBefore = loan['active']
      let contractBefore = await web3.eth.getBalance(loans.address)

      await loans.repay(
        1000,
        0
      )

      loan = await loans.loans.call(0)
      let amountOwedAfter = loan['totalOwed']
      let activeAfter = loan['active']
      let contractAfter = await web3.eth.getBalance(loans.address)

      assert.equal(amountOwedBefore - 1000, amountOwedAfter, 'Amount owed not decreased')
      assert.equal(contractBefore, contractAfter, 'Contract balance shouldnt have changed')
      assert.equal(activeBefore, true, 'Loan wasnt active before')
      assert.equal(activeAfter, true, 'Loan should still be active')
    })

    it('should accept the full loan plus interest, and pay out the collateral', async () => {
      // fetch the loan
      let loan = await loans.loans.call(0)
      let amountOwedBefore = loan['totalOwed']
      let activeBefore = loan['active']
      let collateralBefore = loan['collateral']
      let contractBefore = await web3.eth.getBalance(loans.address)

      await loans.repay(
        amountOwedBefore+100,     // try to pay more than owed
        0
      )

      loan = await loans.loans.call(0)
      let amountOwedAfter = loan['totalOwed']
      let activeAfter = loan['active']
      let contractAfter = await web3.eth.getBalance(loans.address)
      let collateralAfter = loan['collateral']

      assert.equal(contractBefore-collateralBefore, contractAfter, 'Coalteral should have been paid back')
      assert.equal(0, amountOwedAfter, 'Amount owed should be 0')
      assert.equal(0, collateralAfter, 'Collateral should be 0')
      assert.equal(activeBefore, true, 'Loan wasnt active before')
      assert.equal(activeAfter, false, 'Loan should no longer be active')
    })
  })

  describe('Test liquidateLoan()', async () => {
    beforeEach(async () => {
      // setup a loan for Alice
      const fortyFiveMinsAgo = (await getLatestTimestamp()) - (0.75 * ONE_HOUR)
      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, fortyFiveMinsAgo)

      // ETH/DAI price of 205 this time - therefore 30 ETH is enough collateral
      await mockOracle.givenMethodReturnUint(mockOracleValue, 200)

      // create a loan for alice with ID 0
      let hashedLoan = hashLoan({
        interestRate: INTEREST_RATE,        // 700 -> 7.00%
        collateralRatio: COLLATERAL_RATIO,    // 6000 -> 60.00%
        borrower: aliceAddress,
        maxLoanAmount: MAX_LOAN_AMOUNT,
        numberDays: NUMBER_DAYS,
        signerNonce: 0,
      })
      signature = await signLoanHash(web3, signerAddress, hashedLoan)

      await loans.takeOutLoan(
        INTEREST_RATE,
        COLLATERAL_RATIO,
        MAX_LOAN_AMOUNT,
        NUMBER_DAYS,
        MAX_LOAN_AMOUNT,
        {
          signerNonce: 0,
          v: signature.v,
          r: signature.r,
          s: signature.s
        },
        {
          from: aliceAddress,
          value: 35
        }
      )
    })

    it('should not succeed for a non-existent loan', async () => {
      await truffleAssert.reverts(
        loans.liquidateLoan(
          1
        ),
        'LOAN_ID_INVALID'
      )
    })

    it('should not succeed if the loan is not under colalteralised and not expired', async () => {
      await truffleAssert.reverts(
        loans.liquidateLoan(
          0
        ),
        'DOESNT_NEED_LIQUIDATION'
      )
    })

    it('should not proceed if the oracle is outdated', async () => {
      // mock the oracle returning an old timestamp
      const nintyMinsAgo = (await getLatestTimestamp()) - (1.5 * ONE_HOUR)

      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, nintyMinsAgo)

      await truffleAssert.reverts(
        loans.liquidateLoan(
          0
        ),
        'ORACLE_PRICE_OLD'
      )
    })

    it('should succeed if the loan is undercollateralised', async () => {
      // ETH/DAI price of 100 this time - therefore 30 ETH is not enough collateral
      await mockOracle.givenMethodReturnUint(mockOracleValue, 100)

      let loan = await loans.loans.call(0)

      let activeBefore = loan['active']
      let collateralBefore = loan['collateral']
      let contractBefore = await web3.eth.getBalance(loans.address)

      await loans.liquidateLoan(
        0
      )

      loan = await loans.loans.call(0)
      let activeAfter = loan['active']
      let contractAfter = await web3.eth.getBalance(loans.address)
      let collateralAfter = loan['collateral']
      
      assert.equal(contractBefore-collateralBefore, contractAfter, 'Coalteral should have been paid out')
      assert.equal(0, collateralAfter, 'Collateral should be 0')
      assert.equal(activeBefore, true, 'Loan wasnt active before')
      assert.equal(activeAfter, false, 'Loan should no longer be active')
    })

    it('should succeed if the loan is expired', async () => {
      // go forward in time 31 days
      await time.advanceTimeAndBlock(31*ONE_DAY)

      // new oracle time for this future date
      const fortyFiveMinsAgo = (await getLatestTimestamp()) - (0.75 * ONE_HOUR)
      await mockOracle.givenMethodReturnUint(mockOracleTimestamp, fortyFiveMinsAgo)

      let loan = await loans.loans.call(0)

      let activeBefore = loan['active']
      let collateralBefore = loan['collateral']
      let contractBefore = await web3.eth.getBalance(loans.address)

      await loans.liquidateLoan(
        0
      )

      loan = await loans.loans.call(0)
      let activeAfter = loan['active']
      let contractAfter = await web3.eth.getBalance(loans.address)
      let collateralAfter = loan['collateral']
      
      assert.equal(contractBefore-collateralBefore, contractAfter, 'Coalteral should have been paid out')
      assert.equal(0, collateralAfter, 'Collateral should be 0')
      assert.equal(activeBefore, true, 'Loan wasnt active before')
      assert.equal(activeAfter, false, 'Loan should no longer be active')
    })

  })

})