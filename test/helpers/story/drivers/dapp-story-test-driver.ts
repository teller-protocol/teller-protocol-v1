import Chai from 'chai'

import Mocha from 'mocha'
import { Signer, BigNumber } from 'ethers'
import moment from 'moment'

import { Test } from 'mocha'
import { TestScenario, STORY_ACTIONS, TestAction } from '../story-helpers'
import StoryTestDriver from './story-test-driver'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

var expect = Chai.expect

export const DAPPS = {
  LEND: { AAVE: 0, COMPOUND: 1, POOL_TOGETHER: 2 },
  SWAP: { UNISWAP: 0, SUSHISWAP: 1 },
}
/*
We will read state data from the chaindata to determine whether or not each 'action' should pass or fail at the current moment 
Then we will expect that 
*/

export default class DappStoryTestDriver extends StoryTestDriver {
  static generateDomainSpecificTestsForScenario(
    hre: HardhatRuntimeEnvironment,
    scenario: TestScenario
  ): Array<Test> {
    let allTests: Array<Test> = []

    let scenarioActions = scenario.actions

    for (let action of scenarioActions) {
      let testsForAction: Array<Test> =
        DappStoryTestDriver.generateTestsForAction(hre, action)

      allTests = allTests.concat(testsForAction)
    }

    return allTests
  }

  static generateTestsForAction(
    hre: HardhatRuntimeEnvironment,
    action: TestAction
  ): Array<Test> {
    let tests: Array<Test> = []

    let actionType = action.actionType
    let args = action.args

    switch (actionType) {
      case STORY_ACTIONS.DAPP.LEND: {
        let newTest = new Test('Lend DAPP', async function () {
          await DappStoryTestDriver.generateTestsForLend(args.dapp)
        })

        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      case STORY_ACTIONS.DAPP.SWAP: {
        let newTest = new Test('Swap DAPP', async function () {
          await DappStoryTestDriver.generateTestsForSwap(args.dapp)
        })
        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
    }

    return tests
  }

  static async generateTestsForLend(dapp: number | undefined) {
    dapp = dapp ? dapp : 0
    switch (dapp) {
      case DAPPS.LEND.AAVE:
        expect(1).to.equal(1)
        break
      case DAPPS.LEND.COMPOUND:
        expect(1).to.equal(1)
        break
      case DAPPS.LEND.POOL_TOGETHER:
        expect(1).to.equal(1)
        break
      default:
        break
    }
  }

  static async generateTestsForSwap(dapp: number | undefined) {
    dapp = dapp ? dapp : 0
    switch (dapp) {
      case DAPPS.SWAP.UNISWAP:
        expect(1).to.equal(1)
        break
      case DAPPS.SWAP.SUSHISWAP:
        expect(1).to.equal(1)
        break
      default:
        break
    }
  }
}
