import Chai from 'chai'
import { ICErc20 } from '../../../../types/typechain'
import { Test } from 'mocha'
import {
  TestScenario,
  STORY_ACTIONS,
  TestAction,
  TestArgs,
} from '../story-helpers'
import StoryTestDriver from './story-test-driver'
import LoanStoryTestDriver from './loan-story-test-driver'
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
        DappStoryTestDriver.generateTestsForLend(hre, args, tests)
        break
      }
      case STORY_ACTIONS.DAPP.SWAP: {
        DappStoryTestDriver.generateTestsForSwap(hre, args, tests)
        break
      }
    }

    return tests
  }

  static generateTestsForLend(
    hre: HardhatRuntimeEnvironment,
    args: TestArgs,
    tests: Array<Test>
  ) {
    const { getNamedSigner, contracts } = hre
    const dapp = args.dapp ? args.dapp : 0
    switch (dapp) {
      case DAPPS.LEND.AAVE: {
        let newTest = new Test('AAVE Lend DAPP', async function () {
          expect(1).to.equal(1)
        })
        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      case DAPPS.LEND.COMPOUND: {
        let newTest = new Test('COMPOUND Lend DAPP', async function () {
          const borrower = await getNamedSigner('borrower')
          const loan = await LoanStoryTestDriver.getLoan(borrower)
          const { details, diamond } = loan
          const cToken = await contracts.get<ICErc20>('ICErc20', {
            at: await diamond.getAssetCToken(details.lendingToken.address),
          })
          await diamond
            .connect(details.borrower.signer)
            .compoundLend(
              details.loan.id,
              details.loan.lendingToken,
              details.loan.borrowedAmount
            )
          const escrowAddress = await diamond.getLoanEscrow(details.loan.id)
          let cDaiBalance = await cToken.balanceOf(escrowAddress)
          cDaiBalance.eq(0).should.eql(false, '')

          let tokenAddresses: string[]
          tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
          tokenAddresses.should.include(cToken.address)
        })
        console.log('push COMPOUND Lend test ! ')
        tests.push(newTest)
        break
      }
      case DAPPS.LEND.POOL_TOGETHER: {
        let newTest = new Test('POOL_TOGETHER Lend DAPP', async function () {
          expect(1).to.equal(1)
        })
        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      default:
        break
    }
  }

  static async generateTestsForSwap(
    hre: HardhatRuntimeEnvironment,
    args: TestArgs,
    tests: Array<Test>
  ) {
    const { getNamedSigner, tokens } = hre
    const dapp = args.dapp ? args.dapp : 0
    switch (dapp) {
      case DAPPS.SWAP.UNISWAP: {
        let newTest = new Test('UNISWAP Swap DAPP', async function () {
          const borrower = await getNamedSigner('borrower')
          const loan = await LoanStoryTestDriver.getLoan(borrower)
          const { details, diamond } = loan
          const link = await tokens.get('LINK')
          const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

          const lendingBalBefore = await details.lendingToken.balanceOf(
            escrowAddress
          )
          lendingBalBefore
            .gt(0)
            .should.eql(true, 'Loan escrow should have a lending token balance')

          const swapBalBefore = await link.balanceOf(escrowAddress)
          swapBalBefore
            .eq(0)
            .should.eql(
              true,
              'Loan escrow should not have a token balance before swap'
            )

          await diamond
            .connect(details.borrower.signer)
            .uniswapSwap(
              details.loan.id,
              [details.lendingToken.address, link.address],
              lendingBalBefore,
              '0'
            )
            .should.emit(diamond, 'UniswapSwapped')

          const swapBalAfter = await link.balanceOf(escrowAddress)
          swapBalAfter
            .gt(0)
            .should.eql(true, 'Swap token balance not positive after swap')

          const lendingBalAfter = await details.lendingToken.balanceOf(
            escrowAddress
          )
          lendingBalAfter
            .eq(0)
            .should.eql(
              true,
              'Loan escrow has lending token balance after swapping full amount'
            )
        })
        console.log('push UNISWAP Swap test ! ')
        tests.push(newTest)
        break
      }
      case DAPPS.SWAP.SUSHISWAP: {
        let newTest = new Test('SUSHISWAP Swap DAPP', async function () {
          expect(1).to.equal(1)
        })
        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      default:
        break
    }
  }
}
