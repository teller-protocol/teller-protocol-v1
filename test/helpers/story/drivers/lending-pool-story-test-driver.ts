import chai, { expect } from 'chai'
import { BigNumber } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { Test } from 'mocha'
import {
  TestScenario,
  STORY_DOMAINS,
  TestAction,
  LoanSnapshots,
} from '../story-helpers'
import StoryTestDriver from './story-test-driver'
import LoanStoryTestDriver from './loan-story-test-driver'
import { getLPHelpers } from '../../lending-pool'

import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { fundLender, getFunds } from '../../get-funds'
chai.should()
chai.use(solidity)
/*
We will read state data from the chaindata to determine whether or not each 'action' should pass or fail at the current moment 
Then we will expect that 
*/

export default class LPStoryTestDriver extends StoryTestDriver {
  static generateDomainSpecificTestsForScenario(
    hre: HardhatRuntimeEnvironment,
    scenario: TestScenario
  ): Array<Test> {
    let allTests: Array<Test> = []

    let scenarioActions = scenario.actions

    for (let action of scenarioActions) {
      let testsForAction: Array<Test> =
        LPStoryTestDriver.generateTestsForAction(hre, action)

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
      case 'LEND': {
        let newTest = new Test(action.suiteName, async function () {
          const helpers: ReturnType<typeof getLPHelpers> =
            await LPStoryTestDriver.createLPArgs(hre)

          const shouldPass = true
          //read the state and determine if this should pass

          if (shouldPass) {
            // expect(await depositWithArgs(hre, lpArgs)).to.not.throw()
            const deposit = await helpers.deposit()
            console.log({ deposit })
            await helpers.deposit()
          } else {
            expect(await helpers.deposit()).to.be.reverted
          }
        })

        console.log('push new story test !')
        tests.push(newTest)
        break
      }
      case 'WITHDRAW': {
        let newTest = new Test(action.suiteName, async function () {
          const helpers: ReturnType<typeof getLPHelpers> =
            await LPStoryTestDriver.createLPArgs(hre)

          const shouldPass = true
          //read the state and determine if this should pass

          if (shouldPass) {
            await helpers.withdraw()
          } else {
            expect(await helpers.withdraw()).to.be.reverted
          }
        })
        console.log('push new story test !')
        tests.push(newTest)
        break
      }
    }
    return tests
  }

  static createLPArgs = async (
    hre: HardhatRuntimeEnvironment
  ): Promise<ReturnType<typeof getLPHelpers>> => {
    const { getNamedSigner, contracts } = hre
    const borrower = await getNamedSigner('borrower')
    const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
    const { details, diamond } = loan
    const tToken = await contracts.get('ITToken', {
      at: await diamond.getTTokenFor(details.lendingToken.address),
    })
    const maxTVL = await diamond.getAssetMaxTVL(details.lendingToken.address)
    const depositAmount = maxTVL
    await fundLender({
      token: details.lendingToken,
      amount: BigNumber.from(100),
      hre,
    })
    const helpers = getLPHelpers(hre, {
      diamond,
      lendingToken: details.lendingToken,
      tToken: tToken,
      amount: BigNumber.from(100),
    })
    return helpers
    // const depositAmount = BigNumber.from(details.loan.borrowedAmount)
    // await fundLender({
    //   token: details.lendingToken,
    //   amount: depositAmount,
    //   hre,
    // })

    // const lpHelperArgs: LPHelperArgs = {
    //   diamond: diamond,
    //   lendingToken: details.lendingToken,
    //   tToken: tToken,
    // }
    // return lpHelperArgs
  }
}
