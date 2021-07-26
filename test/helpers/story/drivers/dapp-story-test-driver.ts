import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Test } from 'mocha'

import { TestAction, TestScenario } from '../story-helpers'
import { aaveLendTest } from './dapp-utils/aave.utils'
import { compoundClaimTest,compoundLendTest } from './dapp-utils/compound.utils'
import { poolTogetherLendTest } from './dapp-utils/poolTogether.utils'
import { sushiswapSwapTest } from './dapp-utils/sushiswap.utils'
import { uniswapSwapTest } from './dapp-utils/uniswap.utils'
import { yearnLendTest } from './dapp-utils/yearn.utils'
import StoryTestDriver from './story-test-driver'
chai.should()
chai.use(solidity)

/*
We will read state data from the chaindata to determine whether or not each 'action' should pass or fail at the current moment 
Then we will expect that 
*/

export default class DappStoryTestDriver extends StoryTestDriver {
  static generateDomainSpecificTestsForScenario(
    hre: HardhatRuntimeEnvironment,
    scenario: TestScenario,
    parentSuite: Mocha.Suite
  ): Mocha.Suite {
    const scenarioActions = scenario.actions

    for (const action of scenarioActions) {
      const testsForAction: Test[] = DappStoryTestDriver.generateTestsForAction(
        hre,
        action,
        parentSuite
      )
      for (const test of testsForAction) {
        parentSuite.addTest(test)
      }
    }
    return parentSuite
  }

  static generateTestsForAction(
    hre: HardhatRuntimeEnvironment,
    action: TestAction,
    testSuite: Mocha.Suite
  ): Test[] {
    // const _ = testSuite.tests
    const tests: Test[] = []
    const actionParentType = action.actionParentType
    switch (actionParentType) {
      case 'LEND': {
        DappStoryTestDriver.generateTestsForLend(hre, action, tests)
        break
      }
      case 'SWAP': {
        void DappStoryTestDriver.generateTestsForSwap(hre, action, tests)
        break
      }
      case 'CLAIM': {
        void DappStoryTestDriver.generateTestsForClaim(hre, action, tests)
        break
      }
    }

    return tests
  }

  static generateTestsForLend(
    hre: HardhatRuntimeEnvironment,
    action: TestAction,
    tests: Test[]
  ): void {
    const actionType = action.actionType
    switch (actionType) {
      case 'AAVE': {
        const newTest = new Test('AAVE Lend DAPP', async () => {
          await aaveLendTest(hre)
        })
        tests.push(newTest)
        break
      }
      case 'YEARN': {
        const newTest = new Test('YEARN Lend DAPP', async () => {
          await yearnLendTest(hre)
        })
        tests.push(newTest)
        break
      }
      case 'COMPOUND': {
        const newTest = new Test('COMPOUND Lend DAPP', async () => {
          await compoundLendTest(hre)
        })
        tests.push(newTest)
        break
      }
      case 'POOL_TOGETHER': {
        const newTest = new Test('POOL_TOGETHER Lend DAPP', async () => {
          await poolTogetherLendTest(hre)
        })
        tests.push(newTest)
        break
      }
      default:
        break
    }
  }

  static async generateTestsForSwap(
    hre: HardhatRuntimeEnvironment,
    action: TestAction,
    tests: Test[]
  ): Promise<void> {
    const { getNamedSigner } = hre
    const dapp = action.actionType
    switch (dapp) {
      case 'UNISWAP': {
        const newTest = new Test('UNISWAP Swap DAPP', async () => {
          await uniswapSwapTest(hre)
        })
        tests.push(newTest)
        break
      }
      case 'SUSHISWAP': {
        const newTest = new Test('SUSHISWAP Swap DAPP', async () => {
          await sushiswapSwapTest(hre)
        })
        tests.push(newTest)
        break
      }
      default:
        break
    }
  }

  static async generateTestsForClaim(
    hre: HardhatRuntimeEnvironment,
    action: TestAction,
    tests: Test[]
  ): Promise<void> {
    const dapp = action.actionType
    switch (dapp) {
      case 'COMPOUND': {
        const newTest = new Test('COMPOUND Claim COMP', async () => {
          await compoundClaimTest(hre)
        })
        tests.push(newTest)
        break
      }
      default:
        break
    }
  }  
}
