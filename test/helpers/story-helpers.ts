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
import Prando from 'prando'
let rng = new Prando('teller-v1')

export const LOAN_ACTIONS: string[] = [
  'CREATE',
  'TAKE_OUT',
  'LP_LEND',
  'REPAY',
  'LIQUIDATE',
]

interface TestArgs {
  type: string
  pass: boolean
  tx?: Promise<ContractTransaction>
  revert?: string
  description: string
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
  const randomMarket = rng.nextInt(0, markets.length - 1)
  const market = markets[randomMarket]
  console.log({ markets })
  const randomCollateralToken = rng.nextInt(
    0,
    market.collateralTokens.length - 1
  )
  const randomLoanType = rng.nextInt(
    0,
    Object.values(LoanType).filter((value) => typeof value != 'string').length -
      1
  )
  return {
    lendToken: market.lendingToken,
    collToken: market.collateralTokens[randomCollateralToken],
    loanType: randomLoanType,
  }
}

export const generateTests = async (args: TestArgs) => {
  const revert = await hre.evm.snapshot()
  switch (args.type) {
    case LOAN_ACTIONS[0]:
      // expect loan args to match loan case
      const loan_args = create_loan_args()
      console.log(loan_args)

      // run test
      console.log('run')
      const { tx } = await createLoan(loan_args)
      console.log('tx is here')
      if (args.pass) {
        expect(tx).should.exist
      } else {
        console.log('args no pass')
        expect(tx).should.not.exist
      }
      break
    default:
      break
  }
}

const getParents = (id: number) => {
  return STORY_TREE[id]
}
