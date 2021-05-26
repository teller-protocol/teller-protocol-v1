import hre from 'hardhat'
import { ContractTransaction } from 'ethers'
import {
  createLoan,
  LoanType,
  takeOut,
  CreateLoanReturn,
  CreateLoanArgs,
} from '../helpers/loans'
import { getMarkets, getNFT } from '../../config'
import { expect } from 'chai'

export const LOAN_ACTIONS: string[] = [
  'CREATE',
  'TAKE_OUT',
  'LP_LEND',
  'REPAY',
  'LIQUIDATE',
]

interface TestResultArgs {
  type: boolean
  tx?: Promise<ContractTransaction>
  revert: string
}

const STORY_TREE: { [id: number]: number } = {
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
const randomInt = (max: number) => {
  return Math.floor(Math.random() * max)
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

const create_loan_args = (): CreateLoanArgs => {
  const { network } = hre
  const markets = getMarkets(network)
  const randomMarket = randomInt(markets.length)
  const market = markets[randomMarket]
  const randomCollateralToken = randomInt(market.collateralTokens.length)
  const randomLoanType = randomInt(
    Object.values(LoanType).filter((value) => typeof value != 'string').length
  )
  return {
    lendToken: market.lendingToken,
    collToken: market.collateralTokens[randomCollateralToken],
    loanType: randomLoanType,
  }
}

export const generateTests = async (
  loanCase: string,
  result: TestResultArgs
) => {
  console.log(loanCase)
  const revert = await hre.evm.snapshot()
  switch (loanCase) {
    case LOAN_ACTIONS[0]:
      console.log('yes action')
      //   try {
      // expect loan args to match loan case
      const args = create_loan_args()
      console.log(args)

      // run test
      console.log('run')
      const done = await createLoan(args)
      console.log('wait for result', done)
      console.log('result type', result.type)
      // if (result.type) {
      //     await tx.should.exist
      // } else {
      //     await tx.should.be.revertedWith(result.revert)
      // }

      // if for true result, take snapshot
      // await tx.should.be.revertedWith('Pausable: paused')

      // get Node children
      //   } catch (error) {
      //       console.log(error)
      //   }
      break
    default:
      break
  }
}

const getParents = (id: number) => {
  return STORY_TREE[id]
}
