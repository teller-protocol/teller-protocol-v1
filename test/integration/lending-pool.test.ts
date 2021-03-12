import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { getNamedSigner, ethers, evm, toBN } from 'hardhat'
import { BigNumber, BigNumberish } from 'ethers'

import { freshMarket, fundedMarket, MarketReturn } from '../fixtures'
import { getFunds } from '../helpers/get-funds'
import { getLPHelpers } from '../helpers/lending-pool'

chai.should()
chai.use(solidity)

const getLenderFunds = async (
  market: MarketReturn,
  amount: BigNumberish
): Promise<BigNumber> => {
  amount = toBN(amount, await market.lendingToken.decimals())
  // Get lender DAI to deposit
  await getFunds({
    to: await getNamedSigner('lender'),
    tokenSym: await market.lendingToken.symbol(),
    amount,
  })
  return amount
}

describe('LendingPool', () => {
  it('should be able deposit and withdraw all with interest', async () => {
    // Get a fresh market
    const market = await freshMarket()
    const { deposit, withdraw } = getLPHelpers(market)

    const lender = await getNamedSigner('lender')
    const lenderAddress = await lender.getAddress()

    // Fund the market
    const depositAmount = await getLenderFunds(market, 1000)
    await deposit(lender, depositAmount)

    // Fast forward block timestamp by 10 weeks
    await evm.advanceTime(6048000)

    const claimableInterest = await market.lendingPool.callStatic.getClaimableInterestEarned(
      lenderAddress
    )
    claimableInterest
      .isNegative()
      .should.equal(false, 'Lender did not earn interest')

    // Withdraw all funds
    await withdraw(lender)

    const balanceWithInterest = await market.lendingToken.balanceOf(
      await lender.getAddress()
    )
    balanceWithInterest
      .gt(depositAmount)
      .should.eql(true, 'Lender balance did not increase')
  })

  it('should not be allowed to transfer funds unless the loans contract is calling', async () => {
    // Get a funded market
    const market = await fundedMarket()
    const { createLoan } = getLPHelpers(market)

    // Try to transfer funds from the LP
    const borrower = await getNamedSigner('borrower')
    const loanAmount = toBN(100000, 18)
    await createLoan(borrower, loanAmount).should.be.revertedWith(
      'CALLER_NOT_LOANS_CONTRACT'
    )
  })

  it('should transfer funds to the borrower when the loans contract calls', async () => {
    // Get a funded market
    const market = await fundedMarket()
    const { createLoan } = getLPHelpers(market)

    // Impersonate the Loans contract
    const stopImpersonating = await evm.impersonate(market.loans.address)

    // Fund the Loans contract with ETH to send a tx
    await getFunds({
      to: market.loans.address,
      tokenSym: 'ETH',
      amount: toBN(1, 18),
    })

    // Transfer funds to LP
    const borrower = await getNamedSigner('borrower')
    const loanAmount = toBN(100000, 18)
    const loansSigner = ethers.provider.getSigner(market.loans.address)
    await createLoan(borrower, loanAmount, loansSigner)

    // Stop impersonating the LP
    await stopImpersonating()
  })
})
