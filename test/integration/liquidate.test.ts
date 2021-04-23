import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumber, BigNumberish, Signer } from 'ethers'
import hre from 'hardhat'
import moment from 'moment'

import { getMarkets } from '../../config'
import { getPlatformSetting } from '../../tasks'
import { Market } from '../../types/custom/config-types'
import { ERC20, ITellerDiamond } from '../../types/typechain'
import { HUNDRED_PERCENT, LoanStatus } from '../../utils/consts'
import { fundedMarket } from '../fixtures'
import { getFunds } from '../helpers/get-funds'
import {
  createLoan,
  CreateLoanReturn,
  LoanHelpersReturn,
  LoanType,
} from '../helpers/loans'

chai.should()
chai.use(solidity)

const { getNamedSigner, getNamedAccounts, contracts, ethers, evm, toBN } = hre

describe.only('Liquidate Loans', () => {
  getMarkets(hre.network).forEach(testLoans)

  function testLoans(market: Market): void {
    let deployer: Signer
    let liquidator: { signer: Signer; address: string }
    let diamond: ITellerDiamond
    let lendingToken: ERC20
    let collateralToken: ERC20
    let liquidateRewardPercent: BigNumber

    before(async () => {
      // Get a fresh market
      await hre.deployments.fixture(['markets', 'nft'])

      deployer = await getNamedSigner('deployer')
      const liquidatorSigner = await getNamedSigner('liquidator')
      liquidator = {
        signer: liquidatorSigner,
        address: await liquidatorSigner.getAddress(),
      }
      diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
      lendingToken = await hre.tokens.get(market.lendingToken)
      collateralToken = await hre.tokens.get(market.collateralTokens[0])
      liquidateRewardPercent = await getPlatformSetting(
        'LiquidateRewardPercent',
        hre
      ).then(({ value }) => value)
    })

    beforeEach(async () => {
      // Fund the market
      await fundedMarket({ assetSym: market.lendingToken, amount: 1000 })
    })

    interface CreateArgs {
      amount: BigNumberish
      borrower: string
      loanType: LoanType
      duration?: moment.Duration
      encodeOnly?: boolean
    }
    const create = async (args: CreateArgs): Promise<CreateLoanReturn> => {
      const { amount, borrower, loanType, duration } = args
      return await createLoan({
        lendTokenSym: market.lendingToken,
        collTokenSym: market.collateralTokens[0],
        amount,
        borrower,
        loanType,
        duration,
      })
    }

    enum LiqLoanStatus {
      Expired,
    }
    interface TestSetupArgs {
      amount: BigNumberish
      loanType: LoanType
      status: LiqLoanStatus
    }
    const testSetup = async (
      args: TestSetupArgs
    ): Promise<LoanHelpersReturn> => {
      const { borrower } = await getNamedAccounts()
      const duration = moment.duration(2, 'days')

      // Create loan
      const { getHelpers } = await create({
        amount: args.amount,
        borrower,
        loanType: args.loanType,
        duration,
      })
      const helpers = await getHelpers()

      // Deposit collateral needed
      await helpers.collateral.deposit(await helpers.collateral.needed())

      // Advance time
      await evm.advanceTime(moment.duration(5, 'minutes'))

      // Take out loan
      await helpers
        .takeOut()
        .should.emit(diamond, 'LoanTakenOut')
        .withArgs(helpers.details.loan.id, borrower, args.amount)

      // Get the amount that is owed after loan taken out
      helpers.details = await helpers.details.refresh()

      // Get required amount of tokens to repay loan
      let neededAmount = helpers.details.totalOwed
      const tokenBal = await lendingToken.balanceOf(liquidator.address)
      if (tokenBal.lt(neededAmount)) {
        neededAmount = tokenBal.add(neededAmount.sub(tokenBal))
      }

      // Fund lender account
      if (neededAmount.gt(0)) {
        await getFunds({
          to: liquidator.address,
          tokenSym: market.lendingToken,
          amount: neededAmount,
        })
      }
      // Approve the token on the diamond
      await lendingToken
        .connect(liquidator.signer)
        .approve(diamond.address, helpers.details.totalOwed)

      switch (args.status) {
        case LiqLoanStatus.Expired:
          // Advance time
          await evm.advanceTime(helpers.details.loan.loanTerms.duration)
      }

      return helpers
    }

    describe('reward', () => {
      it('should calculate correct liquidation reward for a zero collateral loan', async () => {
        const amount = toBN(100, await lendingToken.decimals())
        const { details } = await testSetup({
          amount,
          loanType: LoanType.ZERO_COLLATERAL,
          status: LiqLoanStatus.Expired,
        })

        // Expected reward amount right after taking out loan w/ 0 collateral should be the amount owed
        const expectedReward = await diamond.getLoanEscrowValue(details.loan.id)
        const reward = await diamond.getLiquidationReward(details.loan.id)
        reward.inLending_.should.eql(
          expectedReward,
          'Invalid zero collateral liquidation reward calculated'
        )
      })

      it('should calculate correct liquidation reward for an under collateralized loan', async () => {
        const amount = toBN(100, await lendingToken.decimals())
        const { details } = await testSetup({
          amount,
          loanType: LoanType.UNDER_COLLATERALIZED,
          status: LiqLoanStatus.Expired,
        })

        // Get the expected reward amount
        const expectedReward = details.totalOwed.add(
          details.totalOwed.mul(liquidateRewardPercent).div(HUNDRED_PERCENT)
        )
        const reward = await diamond.getLiquidationReward(details.loan.id)
        reward.inLending_.should.eql(
          expectedReward,
          'Invalid under collateralized liquidation reward calculated'
        )
      })

      it('should calculate correct liquidation reward for an over collateralized loan', async () => {
        const amount = toBN(100, await lendingToken.decimals())
        const { details } = await testSetup({
          amount,
          loanType: LoanType.OVER_COLLATERALIZED,
          status: LiqLoanStatus.Expired,
        })

        // Get the expected reward amount
        const expectedReward = details.totalOwed.add(
          details.totalOwed.mul(liquidateRewardPercent).div(HUNDRED_PERCENT)
        )
        const reward = await diamond.getLiquidationReward(details.loan.id)
        reward.inLending_.should.eql(
          expectedReward,
          'Invalid over collateralized liquidation reward calculated'
        )
        reward.inLending_
          .gt(details.totalOwed)
          .should.eql(true, 'Reward less than liquidation payment')
      })
    })

    describe('expired', () => {
      it('should be able to liquidate an expired zero collateral loan', async () => {
        const amount = toBN(100, await lendingToken.decimals())
        const { details } = await testSetup({
          amount,
          loanType: LoanType.ZERO_COLLATERAL,
          status: LiqLoanStatus.Expired,
        })

        const liquidatorLendBefore = await lendingToken.balanceOf(
          liquidator.address
        )
        const liquidatorCollBefore = await collateralToken.balanceOf(
          liquidator.address
        )
        const reward = await diamond.getLiquidationReward(details.loan.id)

        await diamond
          .connect(liquidator.signer)
          .liquidateLoan(details.loan.id)
          .should.emit(diamond, 'LoanLiquidated')

        await details
          .refresh()
          .then(({ loan: { status } }) =>
            status.should.eq(LoanStatus.Liquidated, 'Loan not liquidated')
          )

        const liquidatorLendAfter = await lendingToken.balanceOf(
          liquidator.address
        )
        const lendDiff = liquidatorLendAfter
          .add(details.totalOwed)
          .sub(liquidatorLendBefore)
        lendDiff.should.eql(
          reward.inLending_,
          'Expected liquidator to be paid by loan escrow in lending token'
        )

        const liquidatorCollAfter = await collateralToken.balanceOf(
          liquidator.address
        )
        const collDiff = liquidatorCollAfter.sub(liquidatorCollBefore)
        collDiff
          .eq(0)
          .should.eql(
            true,
            'Liquidator collateral token balance should not increase'
          )
      })

      it('should be able to liquidate an expired under collateralized loan', async () => {
        const amount = toBN(100, await lendingToken.decimals())
        const { details, collateral } = await testSetup({
          amount,
          loanType: LoanType.UNDER_COLLATERALIZED,
          status: LiqLoanStatus.Expired,
        })
        // Advance time
        await evm.advanceTime(details.loan.loanTerms.duration)

        const loanCollateral = await collateral.current()
        const liquidatorCollBefore = await collateralToken.balanceOf(
          liquidator.address
        )

        await diamond
          .connect(liquidator.signer)
          .liquidateLoan(details.loan.id)
          .should.emit(diamond, 'LoanLiquidated')

        await details
          .refresh()
          .then(({ loan: { status } }) =>
            status.should.eq(LoanStatus.Liquidated, 'Loan not liquidated')
          )

        const liquidatorCollAfter = await collateralToken.balanceOf(
          liquidator.address
        )
        const collDiff = liquidatorCollAfter.sub(liquidatorCollBefore)

        collDiff.gt(0).should.eql(true, 'Collateral reward not positive')
        collDiff.should.eql(loanCollateral, 'Incorrect collateral reward paid')
      })

      it('should be able to liquidate an expired over collateralized loan', async () => {
        const amount = toBN(100, await lendingToken.decimals())
        const { details } = await testSetup({
          amount,
          loanType: LoanType.OVER_COLLATERALIZED,
          status: LiqLoanStatus.Expired,
        })
        // Advance time
        await evm.advanceTime(details.loan.loanTerms.duration)

        const liquidatorCollBefore = await collateralToken.balanceOf(
          liquidator.address
        )
        const reward = await diamond.getLiquidationReward(details.loan.id)

        await diamond
          .connect(liquidator.signer)
          .liquidateLoan(details.loan.id)
          .should.emit(diamond, 'LoanLiquidated')

        await details
          .refresh()
          .then(({ loan: { status } }) =>
            status.should.eq(LoanStatus.Liquidated, 'Loan not liquidated')
          )

        const liquidatorCollAfter = await collateralToken.balanceOf(
          liquidator.address
        )
        liquidatorCollAfter
          .sub(liquidatorCollBefore)
          .gt(0)
          .should.eql(true, 'Collateral reward not positive')
        liquidatorCollAfter
          .sub(liquidatorCollBefore)
          .should.eql(reward.inCollateral_, 'Incorrect collateral reward paid')
      })
    })
  }
})
