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

    // Fund the market
    const depositAmount = await getLenderFunds(market, 1000)
    await deposit(lender, depositAmount)

    // Fast forward block timestamp by 10 weeks
    await evm.advanceTime(6048000)

    // Withdraw all funds
    await withdraw(lender)
  })

  it('should be able to deposit several times and withdraw all', async () => {
    // Get a fresh market
    const market = await freshMarket()
    const { deposit, withdraw } = getLPHelpers(market)

    const lender = await getNamedSigner('lender')

    // Fund the market
    const depositAmount = await getLenderFunds(market, 1000)
    await deposit(lender, depositAmount.div(2))

    // Fast forward block timestamp by 10 weeks
    await evm.advanceTime(6048000)

    // Fund the market
    await deposit(lender, depositAmount.div(2))

    // Fast forward block timestamp by 10 weeks
    await evm.advanceTime(6048000)

    // Withdraw all funds
    await withdraw(lender)
  })

  it('should not be allowed to transfer funds unless the loans contract is calling', async () => {
    // Get a funded market
    const market = await fundedMarket()

    const borrower = await getNamedSigner('borrower')
    const loanAmount = toBN(100000, 18)

    // Try to transfer funds from the LP
    await market.lendingPool
      .connect(borrower)
      .createLoan(loanAmount, await borrower.getAddress())
      .should.be.revertedWith('CALLER_NOT_LOANS_CONTRACT')
  })

  it('should transfer funds to the borrower when the loans contract calls', async () => {
    // Get a funded market
    const market = await fundedMarket()

    // Impersonate the Loans contract
    const stopImpersonating = await evm.impersonate(market.loans.address)
    const loansSigner = ethers.provider.getSigner(market.loans.address)

    // Fund the Loans contract with ETH to send a tx
    await getFunds({
      to: market.loans.address,
      tokenSym: 'ETH',
      amount: toBN(1, 18),
    })

    // Grab the market state before transferring funds
    const marketStateBefore = await market.lendingPool.callStatic.getMarketStateCurrent()

    const borrowerAddress = await getNamedSigner('borrower').then((a) =>
      a.getAddress()
    )
    const loanAmount = toBN(100000, 18)

    // Transfer funds from the LP
    await market.lendingPool
      .connect(loansSigner)
      .createLoan(loanAmount, borrowerAddress)

    // Check that the market state has been updated and funds have been transferred
    const marketStateAfter = await market.lendingPool.callStatic.getMarketStateCurrent()
    const expectedTotalBorrowed = marketStateBefore.totalBorrowed.add(
      loanAmount
    )
    expectedTotalBorrowed.should.eql(
      marketStateAfter.totalBorrowed,
      'LendingPool did not lend out funds'
    )

    // Stop impersonating the LP
    await stopImpersonating()
  })

  it('', async () => {})
})
