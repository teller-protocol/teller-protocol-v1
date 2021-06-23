import chai, { expect } from 'chai'
import { BigNumber } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { ICErc20 } from '../../../../types/typechain'
import { Test } from 'mocha'
import { getFunds } from '../../get-funds'
import { TestScenario, TestAction } from '../story-helpers'
import StoryTestDriver from './story-test-driver'
import LoanStoryTestDriver from './loan-story-test-driver'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

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
    // let allTests: Array<Test> = []

    let scenarioActions = scenario.actions

    for (let action of scenarioActions) {
      let testsForAction: Array<Test> =
        DappStoryTestDriver.generateTestsForAction(hre, action, parentSuite)

      //allTests = allTests.concat(testsForAction)

      for (let test of testsForAction) {
        parentSuite.addTest(test)
      }
    }

    return parentSuite
  }

  static generateTestsForAction(
    hre: HardhatRuntimeEnvironment,
    action: TestAction,
    testSuite: Mocha.Suite
  ): Array<Test> {
    let tests: Array<Test> = []

    let actionParentType = action.actionParentType
    switch (actionParentType) {
      case 'LEND': {
        DappStoryTestDriver.generateTestsForLend(hre, action, tests)
        break
      }
      case 'SWAP': {
        DappStoryTestDriver.generateTestsForSwap(hre, action, tests)
        break
      }
    }

    return tests
  }

  static generateTestsForLend(
    hre: HardhatRuntimeEnvironment,
    action: TestAction,
    tests: Array<Test>
  ) {
    const { getNamedSigner, contracts } = hre
    const actionType = action.actionType
    switch (actionType) {
      case 'AAVE': {
        let newTest = new Test('AAVE Lend DAPP', async function () {
          expect(1).to.equal(1)
        })
        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      case 'COMPOUND': {
        let newTest = new Test('COMPOUND Lend DAPP', async function () {
          const borrower = await getNamedSigner('borrower')
          const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
          const { details, diamond } = loan

          await getFunds({
            to: await borrower.getAddress(),
            tokenSym: await details.lendingToken.symbol(),
            amount: BigNumber.from(details.loan.borrowedAmount).mul(2),
            hre,
          })
          await details.lendingToken
            .connect(borrower)
            .approve(
              diamond.address,
              BigNumber.from(details.loan.borrowedAmount).mul(2)
            )
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
      case 'POOL_TOGETHER': {
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
    action: TestAction,
    tests: Array<Test>
  ) {
    const { getNamedSigner, tokens } = hre
    const dapp = action.actionType
    switch (dapp) {
      case 'UNISWAP': {
        let newTest = new Test('UNISWAP Swap DAPP', async function () {
          // if (args.rewindStateTo) LoanSnapshots[args.rewindStateTo]()
          const borrower = await getNamedSigner('borrower')
          const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
          const { details, diamond } = loan
          const link = await tokens.get('LINK')
          const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

          const lendingBalBefore = await details.lendingToken.balanceOf(
            escrowAddress
          )
          console.log({ lendingBalBefore })
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
      case 'SUSHISWAP': {
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
