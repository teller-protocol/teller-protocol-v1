import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'
import {
  createAndGetLoan,
  createLoan,
  createMarketWithLoan,
  MarketWithLoanReturn,
} from '../fixtures'
import { Signer } from 'ethers'
import { ERC20Detailed } from '../../types/typechain'

chai.should()
chai.use(solidity)

const { deployments, getNamedSigner, contracts, fastForward, toBN } = hre

const setupTest = deployments.createFixture(async () => {
  const market = await createMarketWithLoan({
    market: {
      market: { lendTokenSym: 'DAI', collTokenSym: 'ETH' },
    },
    borrower: await getNamedSigner('borrower'),
    loanType: 2,
  })
  // Forward timestamp by a day to be able to take out subsequent loans
  await fastForward(90000)

  return {
    ...market,
  }
})

describe('LoanManager', async () => {
  let market: MarketWithLoanReturn
  let borrower: Signer
  let borrowerAddress: string
  let deployer: Signer
  let liquidator: Signer
  let lendingToken: ERC20Detailed
  let loanAmount: string

  // Setup for global tests
  beforeEach(async () => {
    // Execute snapshot and setup for tests
    borrower = await getNamedSigner('borrower')
    borrowerAddress = await borrower.getAddress()
    deployer = await getNamedSigner('deployer')
    liquidator = await getNamedSigner('liquidator')
    market = await setupTest()
    const lendingTokenAddress = await market.lendingPool.lendingToken()
    lendingToken = await contracts.get('ERC20Detailed', {
      at: lendingTokenAddress,
    })
    loanAmount = '1000'
  })

  describe('createLoanWithTerms, takeOutLoan', () => {
    // Creating a loan with terms, depositing collateral and taking out a loan successfully
    it('should be able to take out a loan with collateral', async function () {
      // Create loan
      const loanID = await createLoan(market, 2, '2000', borrower)
      // Get collateral required
      const [
        _,
        collateralNeeded,
      ] = await market.loanManager.getCollateralNeededInfo(loanID)
      // Deposit collateral
      await market.loanManager
        .connect(borrower)
        .depositCollateral(borrowerAddress, loanID, collateralNeeded, {
          value: collateralNeeded,
        })
        .should.emit(market.loanManager, 'CollateralDeposited')
        .withArgs(loanID, borrowerAddress, collateralNeeded)

      await fastForward(300)
      // Get info for created loan
      const loanInfo = await market.loanManager.loans(loanID)

      // Take out loan
      await market.loanManager
        .connect(borrower)
        .takeOutLoan(loanID, toBN(loanAmount, '18'))
        .should.emit(market.loanManager, 'LoanTakenOut')
        .withArgs(
          loanID,
          borrowerAddress,
          loanInfo.escrow,
          toBN(loanAmount, '18')
        )
    })
    // Creating a loan with terms and try to take out a loan without collateral unsuccessfully
    it('should not be able to take out a loan without collateral', async () => {
      // Create loan with terms without depositing collateral
      const createdLoanID = await createLoan(market, 2, loanAmount, borrower)

      // Forward block timestamp
      await fastForward(300)

      // Try to take out loan which should fail
      const fn = () =>
        market.loanManager
          .connect(borrower)
          .takeOutLoan(createdLoanID, hre.toBN(loanAmount, '18'))

      await fn().should.be.revertedWith('MORE_COLLATERAL_REQUIRED')
    })
    // - Taking out and repaying a loan successfully
    it('should be able to take out a loan and repay', async () => {
      // Create and take out loan
      const createdLoan = await createAndGetLoan(market, borrower, 2, hre)

      // Approve loan repayment
      await lendingToken
        .connect(borrower)
        .approve(market.lendingPool.address, createdLoan.totalOwed)

      // Repay loan
      const fn = () =>
        market.loanManager
          .connect(borrower)
          .repay(createdLoan.totalOwed, createdLoan.createdLoanId)

      await fn()
        .should.emit(market.loanManager, 'LoanRepaid')
        .withArgs(
          createdLoan.createdLoanId,
          await borrower.getAddress(),
          createdLoan.totalOwed,
          await borrower.getAddress()
        )
    })
    // - Taking out a loan unsuccessfully with invalid debt ratio
    it('should not be able to take out w/ invalid debt ratio', async () => {
      // Update debt ratio as deployer
      const settings = await contracts.get('Settings')
      const assetSettingsAddress = await settings.assetSettings()
      const assetSettings = await contracts.get('AssetSettings', {
        at: assetSettingsAddress,
      })
      await assetSettings
        .connect(deployer)
        .updateMaxDebtRatio(lendingToken.address, 0)

      // Try to take out another loan which should fail
      await createAndGetLoan(market, borrower, 2, hre).should.be.revertedWith(
        'SUPPLY_TO_DEBT_EXCEEDS_MAX'
      )
    })
    // - Taking out collateral before taking out a loan
    it('should be able to withdraw collateral before takeOutLoan', async () => {
      // Create loan terms
      const loanID = await createLoan(market, 2, '3131', borrower)

      // Get collateral owed for loan
      const [_, collateral] = await market.loanManager.getCollateralNeededInfo(
        loanID
      )

      // Deposit collateral
      await market.loanManager
        .connect(borrower)
        .depositCollateral(borrowerAddress, loanID, collateral, {
          value: collateral,
        })
        .should.emit(market.loanManager, 'CollateralDeposited')
        .withArgs(loanID, borrowerAddress, collateral.toString())

      // Time travel
      await fastForward(600)

      // Withdraw collateral without taking out the loan
      await market.loanManager
        .connect(borrower)
        .withdrawCollateral(collateral, loanID)
        .should.emit(market.loanManager, 'CollateralWithdrawn')
        .withArgs(
          loanID,
          borrowerAddress,
          borrowerAddress,
          collateral.toString()
        )
    })
    // - Taking out partial collateral before taking out a loan
    it('should be able to withdraw partial collateral before takeOutLoan', async () => {
      // Create loan terms
      const loanID = await createLoan(market, 2, '3131', borrower)

      // Get collateral owed for loan
      const [_, collateral] = await market.loanManager.getCollateralNeededInfo(
        loanID
      )

      // Deposit collateral
      await market.loanManager
        .connect(borrower)
        .depositCollateral(borrowerAddress, loanID, collateral, {
          value: collateral,
        })
        .should.emit(market.loanManager, 'CollateralDeposited')
        .withArgs(loanID, borrowerAddress, collateral.toString())

      // Time travel
      await fastForward(600)

      // Withdraw only half the collateral without taking out the loan
      const partialCollateral = collateral.div(2)
      await market.loanManager
        .connect(borrower)
        .withdrawCollateral(partialCollateral, loanID)
        .should.emit(market.loanManager, 'CollateralWithdrawn')
        .withArgs(
          loanID,
          borrowerAddress,
          borrowerAddress,
          partialCollateral.toString()
        )
    })
  })
})
