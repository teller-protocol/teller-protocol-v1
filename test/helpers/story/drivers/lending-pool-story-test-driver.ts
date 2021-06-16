import Chai from 'chai'

import { Test } from 'mocha'
import {
  TestScenario,
  STORY_DOMAINS,
  TestAction,
  LoanSnapshots,
} from '../story-helpers'
import StoryTestDriver from './story-test-driver'
import LoanStoryTestDriver from './loan-story-test-driver'
import {
  LPHelperArgs,
  depositWithArgs,
  withdrawWithArgs,
} from '../../lending-pool'

import { HardhatRuntimeEnvironment } from 'hardhat/types'
var expect = Chai.expect
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
      case STORY_DOMAINS.LENDING_POOL.LEND: {
        let newTest = new Test('Lend to loan', async function () {
          if (args.rewindStateTo) LoanSnapshots[args.rewindStateTo]()
          const lpArgs: LPHelperArgs = await LPStoryTestDriver.createLPArgs(hre)
          if (args.shouldPass) {
            expect(await depositWithArgs(hre, lpArgs)).to.not.throw()
          } else {
            expect(await depositWithArgs(hre, lpArgs)).to.throw()
          }
        })

        console.log('push new story test !')
        tests.push(newTest)
        break
      }
      case STORY_DOMAINS.LENDING_POOL.WITHDRAW: {
        let newTest = new Test('withdraw loan', async function () {
          if (args.rewindStateTo) LoanSnapshots[args.rewindStateTo]()
          const lpArgs: LPHelperArgs = await LPStoryTestDriver.createLPArgs(hre)
          if (args.shouldPass) {
            expect(await withdrawWithArgs(hre, lpArgs)).to.not.throw()
          } else {
            expect(await withdrawWithArgs(hre, lpArgs)).to.throw()
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
  ): Promise<LPHelperArgs> => {
    const { getNamedSigner, contracts } = hre
    const borrower = await getNamedSigner('borrower')
    const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
    const { details, diamond } = loan
    const tToken = await contracts.get('ITToken', {
      at: await diamond.getTTokenFor(details.lendingToken.address),
    })
    const lpHelperArgs: LPHelperArgs = {
      diamond: diamond,
      lendingToken: details.lendingToken,
      tToken: tToken,
    }
    return lpHelperArgs
  }
}
