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
import { ERC20Detailed, Loans } from '../../types/typechain'

chai.should()
chai.use(solidity)

const { deployments, getNamedSigner, contracts, ethers, fastForward } = hre

const setupTest = deployments.createFixture(async () => {
  const market = await createMarketWithLoan({
    market: {
      market: { lendTokenSym: 'DAI', collTokenSym: 'ETH' },
    },
    borrower: await getNamedSigner('borrower'),
    loanType: 2,
  })
  // Forward timestamp by a day to be able to take out subsequent loans
  await hre.fastForward(90000)

  return {
    ...market,
  }
})

describe('Loans', async () => {
  let market: MarketWithLoanReturn
  let borrower: Signer
  let deployer: Signer
  let liquidator: Signer
  let lendingToken: ERC20Detailed
  let loanAmount: string

  // Setup for global tests
  beforeEach(async () => {
    // Execute snapshot and setup for tests
    borrower = await getNamedSigner('borrower')
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
      const createdLoanID = (await createAndGetLoan(market, borrower, 2, hre))
        .createdLoanId
      createdLoanID.should.be.equals('1') // LoanID 0 was created in setupTest()
    })
    // Creating a loan with terms and try to take out a loan without collateral unsuccessfully
    it('should not be able to take out a loan without collateral', async () => {
      // Create loan with terms without depositing collateral
      const createdLoanID = await createLoan(market, 2, loanAmount, borrower)

      // Forward block timestamp
      await fastForward(300)

      // Try to take out loan which should fail
      const fn = () =>
        market.loans
          .connect(borrower)
          .takeOutLoan(createdLoanID, hre.BN(loanAmount, '18'))

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
        market.loans
          .connect(borrower)
          .repay(createdLoan.totalOwed, createdLoan.createdLoanId)

      await fn()
        .should.emit(market.loans, 'LoanRepaid')
        .withArgs(
          createdLoan.createdLoanId,
          await borrower.getAddress(),
          createdLoan.totalOwed,
          await borrower.getAddress(),
          '0'
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
      const fn = () => createAndGetLoan(market, borrower, 2, hre)
      await fn().should.be.revertedWith('SUPPLY_TO_DEBT_EXCEEDS_MAX')
    })
  })
})
