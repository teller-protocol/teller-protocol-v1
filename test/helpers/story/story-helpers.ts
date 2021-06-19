import { Test } from 'mocha'
import LoanStoryTestDriver from './drivers/loan-story-test-driver'
import LPStoryTestDriver from './drivers/lending-pool-story-test-driver'
import DappStoryTestDriver from './drivers/dapp-story-test-driver'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export const LoanSnapshots: { [key: number]: Function } = {}

export const STORY_DOMAINS = {
  LOAN: { TAKE_OUT: 0, REPAY: 1, LIQUIDATE: 2 },
  LENDING_POOL: { LEND: 0, WITHDRAW: 1 },
  DAPP: { LEND: 0, SWAP: 1 },
}

export const TREE_STRUCTURE = {
  LOAN: {
    TAKE_OUT: { 'TAKE_OUT.REPAY': null, 'TAKE_OUT.LIQUIDATE': null },
    REPAY: null,
    LIQUIDATE: null,
  },
  LENDING_POOL: { LEND: null, WITHDRAW: null },
  DAPP: {
    LEND: { COMPOUND: null, AAVE: null, POOL_TOGETHER: null },
    SWAP: { UNISWAP: null, SUSHISWAP: null },
  },
}

export const DAPP_ACTION_TARGETS = {
  LEND: {
    COMPOUND: 0,
    AAVE: 1,
    POOL_TOGETHER: 2,
  },
  SWAP: {
    UNISWAP: 0,
    SUSHISWAP: 1,
  },
}

export interface DomainStoryTests {
  domain: string
  test: Array<Mocha.Test>
}

export interface StoryTest {
  domain: string
  test: Mocha.Test
}

export interface TestScenario {
  domain: string
  //shouldPass: boolean
  actions: TestAction[]
}

export interface TestAction {
  actionType: Number
  suiteName: string
  args: TestArgs
}

export interface TestArgs {
  actionTarget?: number
  dappAction?: number
  rewindStateTo: number | null
  //shouldPass: boolean
  nft?: boolean
}

export const generateStoryTests = (
  hre: HardhatRuntimeEnvironment,
  scenario: TestScenario
): Array<StoryTest> => {
  switch (scenario.domain) {
    case 'LOAN':
      return LoanStoryTestDriver.generateDomainSpecificTestsForScenario(
        hre,
        scenario
      )
      break
    case 'LENDING_POOL':
      return LPStoryTestDriver.generateDomainSpecificTestsForScenario(
        hre,
        scenario
      )
      break
    case 'DAPP':
      return DappStoryTestDriver.generateDomainSpecificTestsForScenario(
        hre,
        scenario
      )
      break
    default:
      return []
      break
  }
}
