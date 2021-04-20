import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumber, BigNumberish, Signer } from 'ethers'
import hre from 'hardhat'

import { getMarkets } from '../../config'
import { Market } from '../../types/custom/config-types'
import { ERC20, ITellerDiamond, ITToken } from '../../types/typechain'
import { fundedMarket } from '../fixtures'
import { fundLender, getFunds } from '../helpers/get-funds'
import { getLPHelpers, LPHelperArgs } from '../helpers/lending-pool'

chai.should()
chai.use(solidity)

describe('Lending Pool', () => {
  // Run tests for all markets
  getMarkets(hre.network).forEach(testLP)

  function testLP(market: Market): void {
    let diamond: ITellerDiamond
    let lendingToken: ERC20
    let tToken: ITToken
    let helpers: ReturnType<typeof getLPHelpers>

    let deployer: Signer
    let lender: Signer

    beforeEach(async () => {
      // Get a fresh market
      await hre.deployments.fixture('markets')

      diamond = await hre.contracts.get('TellerDiamond')
      lendingToken = await hre.tokens.get(market.lendingToken)
      tToken = await hre.contracts.get('ITToken', {
        at: await diamond.getTTokenFor(lendingToken.address),
      })
      helpers = getLPHelpers({
        diamond,
        lendingToken,
        tToken,
      })

      deployer = await hre.getNamedSigner('deployer')
      lender = await hre.getNamedSigner('lender')
    })

    describe(`${market.lendingToken} Lending Pool`, () => {
      it('should not be able deposit directly on the Teller Token contract', async () => {
        await tToken.connect(deployer).restrict(true)

        const depositAmount = await fundLender(lendingToken, 100)
        await tToken
          .connect(lender)
          .functions['mint(uint256)'](depositAmount)
          .should.be.revertedWith('Teller: platform restricted')
      })

      it('should be able deposit and withdraw all with interest', async () => {
        // Fund the market
        const depositAmount = await fundLender(lendingToken, 1000)
        await helpers.deposit(lender, depositAmount)

        // Fast forward block timestamp by 10 weeks
        await hre.evm.advanceTime(6048000)

        // Withdraw all funds
        await helpers.withdraw(lender)

        const balanceWithInterest = await lendingToken.balanceOf(
          await lender.getAddress()
        )
        balanceWithInterest
          .gt(depositAmount)
          .should.eql(true, 'Lender balance did not increase')
      })

      // it('should not be allowed to transfer funds unless the loan manager contract is calling', async () => {
      //   // Get a funded market
      //   await fundedMarket()
      //   const { createLoan } = getLPHelpers(args)
      //
      //   // Try to transfer funds from the LP
      //   const borrower = await getNamedSigner('borrower')
      //   const loanAmount = toBN(100000, 18)
      //   await createLoan(borrower, loanAmount, borrower).should.be.revertedWith(
      //     'CALLER_NOT_LOANS_CONTRACT'
      //   )
      // })
      //
      // /**
      //  * This is a test function for borrowing funds from the LP. Since some functionality
      //  * requires funds to be borrowed, such as repayments, the test function has been
      //  * extracted so it can be used in other test functions to help reduce amount of
      //  * duplicated code.
      //  */
      // const borrowFunds = async (): Promise<void> => {
      //   // Get a funded market
      //   await fundedMarket()
      //   const { createLoan } = getLPHelpers(args)
      //
      //   // Impersonate the LoanManager contract
      //   const loansImpersonation = await evm.impersonate(
      //     market.loanManager.address
      //   )
      //   // Fund the LoanManager contract with ETH to send a tx
      //   await getFunds({
      //     to: market.loanManager.address,
      //     tokenSym: 'ETH',
      //     amount: toBN(1, 18),
      //   })
      //
      //   // Transfer funds to LP
      //   const borrower = await getNamedSigner('borrower')
      //   const loanAmount = toBN(100000, 18)
      //   await createLoan(borrower, loanAmount, loansImpersonation.signer)
      //
      //   // Stop impersonating the LP
      //   await loansImpersonation.stop()
      //
      //   return market
      // }
      // it(
      //   'should transfer funds to the borrower when the loan manager contract calls',
      //   borrowFunds
      // )
      //
      // it('should only accept repayments from the LoanManager contract', async () => {
      //   const market = await borrowFunds()
      //   const { repay } = getLPHelpers(market)
      //
      //   const borrower = await getNamedSigner('borrower')
      //   const principalAmount = toBN(1000, 18)
      //   const interestAmount = toBN(100, 18)
      //
      //   // Get funds to repay
      //   await getFunds({
      //     to: borrower,
      //     tokenSym: await market.lendingToken.symbol(),
      //     amount: principalAmount.add(interestAmount),
      //   })
      //
      //   // Try to repay funds to the LP
      //   await repay(
      //     borrower,
      //     principalAmount,
      //     interestAmount,
      //     borrower
      //   ).should.be.revertedWith('CALLER_NOT_LOANS_CONTRACT')
      // })
      //
      // it('should be able to accept payments to be deposited back into the LP', async () => {
      //   const market = await borrowFunds()
      //   const { repay } = getLPHelpers(market)
      //
      //   // Impersonate the LoanManager contract
      //   const loansImpersonation = await evm.impersonate(market.loanManager.address)
      //   // Fund the LoanManager contract with ETH to send a tx
      //   await getFunds({
      //     to: market.loanManager.address,
      //     tokenSym: 'ETH',
      //     amount: toBN(1, 18),
      //   })
      //
      //   const borrower = await getNamedSigner('borrower')
      //   const principalAmount = toBN(1000, 18)
      //   const interestAmount = toBN(100, 18)
      //
      //   // Get funds to repay
      //   await getFunds({
      //     to: borrower,
      //     tokenSym: await market.lendingToken.symbol(),
      //     amount: principalAmount.add(interestAmount),
      //   })
      //
      //   // Try to repay funds to the LP
      //   await repay(
      //     borrower,
      //     principalAmount,
      //     interestAmount,
      //     loansImpersonation.signer
      //   )
      //
      //   await loansImpersonation.stop()
      // })
      //
      // it('should be able to swap accumulated comp for underlying token', async () => {
      //   const market = await fundedMarket()
      //   const { lendingPool, lendingToken } = market
      //   const { withdraw } = getLPHelpers(market)
      //   const funder = await getNamedSigner('funder')
      //   const balanceBefore = await lendingToken.balanceOf(lendingPool.address)
      //
      //   await fastForward(86400 * 10)
      //   await withdraw(funder, toBN(10, 18))
      //   await lendingPool.swapAccumulatedComp()
      //
      //   const balanceAfter = await lendingToken.balanceOf(lendingPool.address)
      //
      //   balanceAfter.sub(balanceBefore).gt(0).should.be.true
      // })
    })
  }
})
