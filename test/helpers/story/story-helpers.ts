import { Test } from 'mocha'
import hre from 'hardhat'
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

export const STORY_NETWORKS = {
  POLYGON: 'polygon',
  MAINNET: 'mainnet',
  ALL: 'all',
}

export const TREE_STRUCTURE = {
  'LOAN.TAKE_OUT': { network: STORY_NETWORKS.ALL },
  'LOAN.REPAY': { network: STORY_NETWORKS.ALL, parents: ['LOAN.TAKE_OUT'] },
  'LOAN.LIQUIDATE': {
    network: STORY_NETWORKS.ALL,
    parents: ['LOAN.TAKE_OUT'],
  },
  'LENDING_POOL.LEND': {
    network: STORY_NETWORKS.ALL,
    parents: ['LOAN.TAKE_OUT'],
  },
  'LENDING_POOL.WITHDRAW': {
    network: STORY_NETWORKS.ALL,
    parents: ['LENDING_POOL.LEND', 'LOAN.TAKE_OUT'],
  },
  'DAPP.LEND.COMPOUND': {
    network: STORY_NETWORKS.ALL,
    parents: ['LOAN.TAKE_OUT'],
  },
  'DAPP.LEND.AAVE': {
    network: STORY_NETWORKS.MAINNET,
    parents: ['LOAN.TAKE_OUT'],
  },
  'DAPP.LEND.POOL_TOGETHER': {
    network: STORY_NETWORKS.MAINNET,
    parents: ['LOAN.TAKE_OUT'],
  },
  'DAPP.SWAP.UNISWAP': {
    network: STORY_NETWORKS.MAINNET,
    parents: ['LOAN.TAKE_OUT'],
  },
  'DAPP.SWAP.SUSHISWAP': {
    network: STORY_NETWORKS.POLYGON,
    parents: ['LOAN.TAKE_OUT'],
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

// export interface Story

export interface StoryValues {
  network: string
  parents?: Array<string>
}

export interface TestScenario {
  domain: string
  //shouldPass: boolean
  actions: TestAction[]
}

export interface TestAction {
  actionType: string
  suiteName: string
  args: TestArgs
}

export interface TestArgs {
  actionTarget?: number
  dappAction?: number
  // rewindStateTo: string | null
  //shouldPass: boolean
  nft?: boolean
}

export const generateTests = (
  hre: HardhatRuntimeEnvironment,
  scenario: TestScenario
): Array<Test> => {
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
