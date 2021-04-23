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

describe('Liquidate Loans', () => {
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

    interface TestSetupArgs {
      amount: BigNumberish
      loanType: LoanType
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

      // Advance time
      await evm.advanceTime(duration)

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

      return helpers
    }

    it('should calculate correct liquidation reward for an under collateralized loan', async () => {
      const amount = toBN(100, await lendingToken.decimals())
      const { details } = await testSetup({
        amount,
        loanType: LoanType.UNDER_COLLATERALIZED,
      })

      // Get the expected reward amount
      const expectedReward = details.totalOwed.add(
        details.totalOwed.mul(liquidateRewardPercent).div(HUNDRED_PERCENT)
      )
      const reward = await diamond.getLiquidationReward(details.loan.id)
      reward.inLending_.should.eql(
        expectedReward,
        'Invalid liquidation reward calculated'
      )
    })

    it('should calculate correct liquidation reward for an over collateralized loan', async () => {
      const amount = toBN(100, await lendingToken.decimals())
      const { details } = await testSetup({
        amount,
        loanType: LoanType.OVER_COLLATERALIZED,
      })

      // Get the expected reward amount
      const expectedReward = details.totalOwed.add(
        details.totalOwed.mul(liquidateRewardPercent).div(HUNDRED_PERCENT)
      )
      const reward = await diamond.getLiquidationReward(details.loan.id)
      reward.inLending_.should.eql(
        expectedReward,
        'Invalid liquidation reward calculated'
      )
      reward.inLending_
        .gt(details.totalOwed)
        .should.eql(true, 'Reward less than liquidation payment')
    })

    it('should be able to liquidate an expired loan', async () => {
      const amount = toBN(100, await lendingToken.decimals())
      const { details, collateral } = await testSetup({
        amount,
        loanType: LoanType.OVER_COLLATERALIZED,
      })

      const availableColl = await collateral.current()
      console.log('collateral', availableColl.toString())

      const liquidatorCollBefore = await collateralToken.balanceOf(
        liquidator.address
      )
      const reward = await diamond.getLiquidationReward(details.loan.id)

      const tx = await diamond
        .connect(liquidator.signer)
        .liquidateLoan(details.loan.id)

      await tx.should.emit(diamond, 'LoanLiquidated')

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
  }
})
