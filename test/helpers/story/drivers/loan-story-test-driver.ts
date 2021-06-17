import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Test } from 'mocha'
import {
  TestScenario,
  STORY_DOMAINS,
  TestAction,
  LoanSnapshots,
  TestArgs,
} from '../story-helpers'
import StoryTestDriver from './story-test-driver'

import { Signer, BigNumber, ContractTransaction } from 'ethers'
import moment from 'moment'

import { getPlatformSetting, updatePlatformSetting } from '../../../../tasks'
import { ITellerDiamond } from '../../../../types/typechain'
import { getMarkets } from '../../../../config'
import { getFunds } from '../../get-funds'
import {
  LoanType,
  CreateLoanArgs,
  RepayLoanArgs,
  LoanHelpersReturn,
  loanHelpers,
  takeOutLoanWithoutNfts,
  takeOutLoanWithNfts,
  repayLoan,
  CreateLoanReturn,
} from '../../loans'

import Prando from 'prando'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
let rng = new Prando('teller')

chai.should()
chai.use(solidity)
/*
We will read state data from the chaindata to determine whether or not each 'action' should pass or fail at the current moment 
Then we will expect that 
*/

export default class LoanStoryTestDriver extends StoryTestDriver {
  static generateDomainSpecificTestsForScenario(
    hre: HardhatRuntimeEnvironment,
    scenario: TestScenario
  ): Array<Test> {
    let allTests: Array<Test> = []

    let scenarioActions = scenario.actions

    for (let action of scenarioActions) {
      let testsForAction: Array<Test> =
        LoanStoryTestDriver.generateTestsForAction(hre, action)
      allTests = allTests.concat(testsForAction)
    }
    return allTests
  }

  static generateTestsForAction(
    hre: HardhatRuntimeEnvironment,
    action: TestAction
  ): Array<Test> {
    let tests: Array<Test> = []

    const { actionType, args } = action
    switch (actionType) {
      case STORY_DOMAINS.LOAN.TAKE_OUT: {
        let newTest = new Test(action.suiteName, async function () {
          let shouldPass = true
          //read the state and determine if this should pass
          const borrower = await hre.getNamedSigner('borrower')
          const diamond = await hre.contracts.get<ITellerDiamond>(
            'TellerDiamond'
          )
          const allBorrowerLoans = await diamond.getBorrowerLoans(
            await borrower.getAddress()
          )
          if (allBorrowerLoans.length > 0) shouldPass = false
          console.log({ allBorrowerLoans, shouldPass })
          if (shouldPass) {
            expect(await LoanStoryTestDriver.takeOutLoan(hre, args)).to.exist
            LoanSnapshots[STORY_DOMAINS.LOAN.TAKE_OUT] =
              await hre.evm.snapshot()
          } else {
            // await LoanStoryTestDriver.takeOutLoan(hre, args).should.be.rejected
          }
        })
        console.log('push STORY_ACTIONS.LOAN.TAKE_OUT test! ')
        tests.push(newTest)
        break
      }
      case STORY_DOMAINS.LOAN.REPAY: {
        let newTest = new Test(action.suiteName, async function () {
          // if (args.rewindStateTo) LoanSnapshots[args.rewindStateTo]()
          const shouldPass = true
          //read the state and determine if this should pass

          if (shouldPass) {
            const tx = await LoanStoryTestDriver.repayLoan(hre)
            expect(tx).to.exist
          } else {
            expect(await LoanStoryTestDriver.repayLoan(hre)).to.throw()
          }
        })
        console.log('push STORY_ACTIONS.LOAN.REPAY test ! ')
        tests.push(newTest)
        break
      }
      case STORY_DOMAINS.LOAN.LIQUIDATE: {
        let newTest = new Test(action.suiteName, async function () {
          // if (args.rewindStateTo) LoanSnapshots[args.rewindStateTo]()
          const shouldPass = false
          //read the state and determine if this should pass

          if (shouldPass) {
            const tx = await LoanStoryTestDriver.liquidateLoan(hre)
            expect(tx).to.exist
          } else {
            expect(await LoanStoryTestDriver.liquidateLoan(hre)).to.be.reverted
          }
        })
        console.log('push STORY_ACTIONS.LOAN.LIQUIDATE test ! ')
        tests.push(newTest)
        break
      }
    }
    return tests
  }

  static createLoanArgs = (
    hre: HardhatRuntimeEnvironment,
    borrower: string
  ): CreateLoanArgs => {
    const { network } = hre
    const markets = getMarkets(network)
    const randomMarket = rng.nextInt(0, markets.length - 1)
    const market = markets[randomMarket]
    // console.log({ markets })
    const randomCollateralToken = rng.nextInt(
      0,
      market.collateralTokens.length - 1
    )
    const randomLoanType = rng.nextInt(
      0,
      Object.values(LoanType).length / 2 - 1
    )
    return {
      lendToken: market.lendingToken,
      collToken: market.collateralTokens[randomCollateralToken],
      borrower,
      loanType: randomLoanType,
    }
  }

  static takeOutLoan = async (
    hre: HardhatRuntimeEnvironment,
    args: TestArgs
  ): Promise<ContractTransaction> => {
    const { value: rateLimit } = await getPlatformSetting(
      'RequestLoanTermsRateLimit',
      hre
    )
    await hre.evm.advanceTime(rateLimit)
    const borrowerAddress = (await hre.getNamedAccounts()).borrower
    const createArgs = LoanStoryTestDriver.createLoanArgs(hre, borrowerAddress)
    const funcToRun =
      args.nft == true ? takeOutLoanWithNfts : takeOutLoanWithoutNfts
    // if(!args.nft)
    const { tx, getHelpers } = await funcToRun(hre, createArgs)
    return tx
  }

  static getLoan = async (
    hre: HardhatRuntimeEnvironment,
    borrower: Signer
  ): Promise<LoanHelpersReturn> => {
    const diamond = await hre.contracts.get<ITellerDiamond>('TellerDiamond')
    const allBorrowerLoans = await diamond.getBorrowerLoans(
      await borrower.getAddress()
    )
    console.log({ allBorrowerLoans })
    // expect(
    //   allBorrowerLoans.length,
    //   'allBorrowerLoans must be greater than 0'
    // ).to.be.greaterThan(0)
    if (allBorrowerLoans.length == 0) throw Error('No borrower loans')
    const loanID = allBorrowerLoans[allBorrowerLoans.length - 1].toString()
    return loanHelpers(hre, loanID)
  }

  static liquidateLoan = async (
    hre: HardhatRuntimeEnvironment
  ): Promise<ContractTransaction> => {
    const borrowerAddress = (await hre.getNamedAccounts()).borrower
    const borrower = await hre.ethers.provider.getSigner(borrowerAddress)
    const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
    const { details, diamond, collateral } = loan
    console.log({ duration: details.loan.duration })
    await hre.evm.advanceTime(details.loan.duration + 3600)
    const liquidator = await hre.getNamedSigner('liquidator')
    let borrowedAmount = details.loan.borrowedAmount
    await getFunds({
      to: await liquidator.getAddress(),
      tokenSym: await details.lendingToken.symbol(),
      amount: BigNumber.from(borrowedAmount).mul(2),
      hre,
    })
    await details.lendingToken
      .connect(liquidator)
      .approve(diamond.address, BigNumber.from(borrowedAmount).mul(2))
    const tx = await diamond.connect(liquidator).liquidateLoan(details.loan.id)
    return tx
  }

  static repayLoan = async (
    hre: HardhatRuntimeEnvironment
  ): Promise<ContractTransaction> => {
    const borrower = await hre.getNamedSigner('borrower')
    const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
    const { details, diamond } = loan
    const borrowedAmount = details.loan.borrowedAmount
    const repayLoanArgs: RepayLoanArgs = {
      amount: details.loan.borrowedAmount,
      from: details.borrower.signer,
      diamond,
      details,
    }
    await hre.evm.advanceTime(moment.duration(10, 'minutes'))
    const borrowerAddress = await borrower.getAddress()
    await getFunds({
      to: borrowerAddress,
      tokenSym: await details.lendingToken.symbol(),
      amount: BigNumber.from(borrowedAmount).mul(2),
      hre,
    })
    const approve = await details.lendingToken
      .connect(borrower)
      .approve(diamond.address, BigNumber.from(borrowedAmount).mul(2))
    const tx = await repayLoan(repayLoanArgs)
    return tx
  }
}
