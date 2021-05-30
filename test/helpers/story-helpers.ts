import hre from 'hardhat'
import {
  createLoan,
  LoanType,
  takeOut,
  takeOutLoan,
  TakeOutLoanArgs,
  CreateLoanArgs,
} from '../helpers/loans'
import { getMarkets, getNFT } from '../../config'
import Prando from 'prando'
import moment from 'moment'
let rng = new Prando('teller-v1')

export const LOAN_ACTIONS: string[] = [
  'CREATE',
  'TAKE_OUT',
  'LP_LEND',
  'REPAY',
  'LIQUIDATE',
]

// generate test arg details based off action and pass
interface TestArgs {
  type: string
  pass: boolean
  revert?: string
  nft?: boolean
  loanArgs?: Object
}

const STORY_TREE: { [id: number]: number } = {
  0: -1,
  1: 0,
  2: 0,
  3: 1,
  4: 1,
}

const SNAPSHOTS: { [name: string]: Function } = {}

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

const createLoanArgs = (): CreateLoanArgs => {
  const { network } = hre
  const markets = getMarkets(network)
  const randomMarket = rng.nextInt(0, markets.length - 1)
  const market = markets[randomMarket]
  console.log({ markets })
  const randomCollateralToken = rng.nextInt(
    0,
    market.collateralTokens.length - 1
  )
  const randomLoanType = rng.nextInt(0, Object.values(LoanType).length / 2 - 1)
  return {
    lendToken: market.lendingToken,
    collToken: market.collateralTokens[randomCollateralToken],
    loanType: randomLoanType,
  }
}

export const generateTests = async (args: TestArgs) => {
  SNAPSHOTS.revert = await hre.evm.snapshot()
  switch (args.type) {
    case LOAN_ACTIONS[0]: {
      const loanID = 0
      try {
        // expect loan args to match loan case
        const createArgs = createLoanArgs()

        // run test
        console.log(
          `${LOAN_ACTIONS[loanID].toLowerCase()} loan should ${
            args.pass == true ? 'pass' : 'fail'
          }`.underline.magenta
        )
        const { tx, getHelpers } = await createLoan(createArgs)
        if (args.pass) {
          // check use cases
          if (tx) console.log(`- Pass`.green)
          //take snapshot
          SNAPSHOTS.create_loan = await hre.evm.snapshot()
          // get children
          const children = getChildren(loanID)
          if (children.length > 0) {
            const randomChild = rng.nextInt(0, children.length - 1)
            const child = children[randomChild]
            const helpers = await getHelpers()
            const { diamond, collateral, details, takeOut } = helpers
            switch (child) {
              case 1:
                const neededCollateral = await collateral.needed()
                if (neededCollateral.gt(0)) {
                  await collateral.deposit(neededCollateral)
                }
                await generateTests({
                  type: LOAN_ACTIONS[children[randomChild]],
                  pass: args.pass,
                  revert: args.revert,
                  loanArgs: {
                    type: LOAN_ACTIONS[children[randomChild]],
                    amount: details.terms.maxLoanAmount,
                    from: details.borrower.signer,
                    nft: args.nft ? args.nft : false,
                    diamond,
                    details,
                  },
                })
                break
              case 2:
                break
            }
          }
        } else {
          console.log(`- Failed`.red)
        }
      } catch (error) {
        console.log(
          `${LOAN_ACTIONS[loanID].toLowerCase()} loan should ${
            args.pass == true ? 'pass' : 'fail'
          }`.underline.magenta
        )
        if (!args.pass) {
          console.log(`- Pass`.green)
        } else {
          console.log(`- Failed`.red)
        }
      }
      break
    }
    case LOAN_ACTIONS[1]: {
      const loanID = 1
      let takeOutLoanArgs: TakeOutLoanArgs
      console.log(
        `${LOAN_ACTIONS[loanID].toLowerCase()} should ${
          args.pass == true ? 'pass' : 'fail'
        }`.underline.magenta
      )
      try {
        if (!args.loanArgs) {
          console.log(`- Fail`.red)
          break
        }
        takeOutLoanArgs = {
          amount: args.loanArgs.amount,
          from: args.loanArgs.from,
          nft: args.loanArgs.nft,
          diamond: args.loanArgs.diamond,
          details: args.loanArgs.details,
        }
        await hre.evm.advanceTime(moment.duration(5, 'minutes'))
        const tx = await takeOutLoan(takeOutLoanArgs)
        if (args.pass) {
          // check use cases
          if (tx) console.log(`- Pass`.green)

          //take snapshot
          SNAPSHOTS.takeout_loan = await hre.evm.snapshot()
          // get children
          const children = getChildren(loanID)
          if (children.length > 0) {
            const randomChild = rng.nextInt(0, children.length - 1)
            console.log('randomChild is: ', children[randomChild])
            await generateTests({
              type: LOAN_ACTIONS[children[randomChild]],
              pass: args.pass,
              revert: args.revert,
            })
          }
        } else {
          console.log(`- Failed`.red)
        }
      } catch (error) {
        console.log(
          `${LOAN_ACTIONS[loanID].toLowerCase()} loan should ${
            args.pass == true ? 'pass' : 'fail'
          }`.underline.magenta
        )
        if (!args.pass) {
          console.log(`- Pass`.green)
        } else {
          console.log(`- Failed`.red)
        }
      }

      break
    }
    case LOAN_ACTIONS[2]: {
      const loanID = 3
      let takeOutLoanArgs: TakeOutLoanArgs
      console.log(
        `${LOAN_ACTIONS[loanID].toLowerCase()} should ${
          args.pass == true ? 'pass' : 'fail'
        }`.underline.magenta
      )
      try {
        if (!args.loanArgs) {
          console.log(`- Fail`.red)
          break
        }
        takeOutLoanArgs = {
          amount: args.loanArgs.amount,
          from: args.loanArgs.from,
          nft: args.loanArgs.nft,
          diamond: args.loanArgs.diamond,
          details: args.loanArgs.details,
        }
        await hre.evm.advanceTime(moment.duration(5, 'minutes'))
        const tx = await takeOutLoan(takeOutLoanArgs)
        if (args.pass) {
          // check use cases
          if (tx) console.log(`- Pass`.green)

          //take snapshot
          SNAPSHOTS.takeout_loan = await hre.evm.snapshot()
          // get children
          const children = getChildren(loanID)
          if (children.length > 0) {
            const randomChild = rng.nextInt(0, children.length - 1)
            console.log('randomChild is: ', children[randomChild])
            await generateTests({
              type: LOAN_ACTIONS[children[randomChild]],
              pass: args.pass,
              revert: args.revert,
            })
          }
        } else {
          console.log(`- Failed`.red)
        }
      } catch (error) {
        console.log(
          `${LOAN_ACTIONS[loanID].toLowerCase()} loan should ${
            args.pass == true ? 'pass' : 'fail'
          }`.underline.magenta
        )
        if (!args.pass) {
          console.log(`- Pass`.green)
        } else {
          console.log(`- Failed`.red)
        }
      }
    }
    case LOAN_ACTIONS[3]: {
      const loanID = 3
      let takeOutLoanArgs: TakeOutLoanArgs
      console.log(
        `${LOAN_ACTIONS[loanID].toLowerCase()} should ${
          args.pass == true ? 'pass' : 'fail'
        }`.underline.magenta
      )
      try {
        if (!args.loanArgs) {
          console.log(`- Fail`.red)
          break
        }
        takeOutLoanArgs = {
          amount: args.loanArgs.amount,
          from: args.loanArgs.from,
          nft: args.loanArgs.nft,
          diamond: args.loanArgs.diamond,
          details: args.loanArgs.details,
        }
        await hre.evm.advanceTime(moment.duration(5, 'minutes'))
        const tx = await takeOutLoan(takeOutLoanArgs)
        if (args.pass) {
          // check use cases
          if (tx) console.log(`- Pass`.green)

          //take snapshot
          SNAPSHOTS.takeout_loan = await hre.evm.snapshot()
          // get children
          const children = getChildren(loanID)
          if (children.length > 0) {
            const randomChild = rng.nextInt(0, children.length - 1)
            console.log('randomChild is: ', children[randomChild])
            await generateTests({
              type: LOAN_ACTIONS[children[randomChild]],
              pass: args.pass,
              revert: args.revert,
            })
          }
        } else {
          console.log(`- Failed`.red)
        }
      } catch (error) {
        console.log(
          `${LOAN_ACTIONS[loanID].toLowerCase()} loan should ${
            args.pass == true ? 'pass' : 'fail'
          }`.underline.magenta
        )
        if (!args.pass) {
          console.log(`- Pass`.green)
        } else {
          console.log(`- Failed`.red)
        }
      }
    }
    case LOAN_ACTIONS[4]: {
      const loanID = 4
      let takeOutLoanArgs: TakeOutLoanArgs
      console.log(
        `${LOAN_ACTIONS[loanID].toLowerCase()} should ${
          args.pass == true ? 'pass' : 'fail'
        }`.underline.magenta
      )
      try {
        if (!args.loanArgs) {
          console.log(`- Fail`.red)
          break
        }
        takeOutLoanArgs = {
          amount: args.loanArgs.amount,
          from: args.loanArgs.from,
          nft: args.loanArgs.nft,
          diamond: args.loanArgs.diamond,
          details: args.loanArgs.details,
        }
        await hre.evm.advanceTime(moment.duration(5, 'minutes'))
        const tx = await takeOutLoan(takeOutLoanArgs)
        if (args.pass) {
          // check use cases
          if (tx) console.log(`- Pass`.green)

          //take snapshot
          SNAPSHOTS.takeout_loan = await hre.evm.snapshot()
          // get children
          const children = getChildren(loanID)
          if (children.length > 0) {
            const randomChild = rng.nextInt(0, children.length - 1)
            console.log('randomChild is: ', children[randomChild])
            await generateTests({
              type: LOAN_ACTIONS[children[randomChild]],
              pass: args.pass,
              revert: args.revert,
            })
          }
        } else {
          console.log(`- Failed`.red)
        }
      } catch (error) {
        console.log(
          `${LOAN_ACTIONS[loanID].toLowerCase()} loan should ${
            args.pass == true ? 'pass' : 'fail'
          }`.underline.magenta
        )
        if (!args.pass) {
          console.log(`- Pass`.green)
        } else {
          console.log(`- Failed`.red)
        }
      }
    }
    default:
      break
  }
}

const getParents = (id: number) => {
  return STORY_TREE[id]
}
