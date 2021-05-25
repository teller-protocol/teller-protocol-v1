import colors from 'colors'
import { Contract } from 'ethers'
import hre from 'hardhat'
import { DeployOptions, DeployResult } from 'hardhat-deploy/dist/types'
import { Libraries } from 'hardhat-deploy/types'

const LOAN_ACTIONS = {
  0: 'CREATE',
  1: 'TAKE_OUT',
  2: 'LP_LEND',
  3: 'REPAY',
  4: 'LIQUIDATE',
}

const LOAN_RESULTS = {
  SUCCESS: true,
  FAIL: false,
}

const STORY_TREE = {
  0: -1,
  1: 0,
  2: 0,
  3: 1,
  4: 1,
}

// - Create loan → snapshot (root) []
//     - take out
// - Take out loan → snapshot (left) [1] (supporting functions) (activate)
//     - repay [1]
//     - liquidate [1]
// - LP Lend -> snapshot (right)
// - Repay (left)
// - Liquidate (right)
// - Lend Compound
// - Redeem Compound
export const checkDeployed = async (): Promise<boolean> => {
  const { contracts } = hre
  try {
    await contracts.get('TellerDiamond')
    return true
  } catch (error) {
    return false
  }
}

const getChildren = (id: number) => {
  return Object.entries(STORY_TREE).reduce(
    (prev: Array<any>, value: Array<any>) => {
      if (value[1] == id) {
        const child: number = Number(value[0])
        prev.push(child)
      }
      return prev
    },
    []
  )
}

const getParents = (id: number) => {
  return STORY_TREE[id]
}
