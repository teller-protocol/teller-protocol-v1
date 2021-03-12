import { evm } from 'hardhat'
import { BigNumber, Signer } from 'ethers'

import { GetMarketReturn } from '../../tasks'

export interface LendingPoolTestHelpers {
  deposit(lender: Signer, amount: BigNumber): Promise<void>
  withdraw(lender: Signer, amount?: BigNumber): Promise<void>
}

export const getLPHelpers = (
  market: GetMarketReturn
): LendingPoolTestHelpers => ({
  deposit: depositWithMarket(market),
  withdraw: withdrawWithMarket(market),
})

export const depositWithMarket = (market: GetMarketReturn) => async (
  lender: Signer,
  amount: BigNumber
) => {
  // Approve amount to loan
  await market.lendingToken
    .connect(lender)
    .approve(market.lendingPool.address, amount)

  const expectedTTokenAmount = await evm.withBlockScope(1, () =>
    market.lendingPool.callStatic.tTokensFromLendingTokens(amount)
  )

  // Deposit into lending pool
  await market.lendingPool
    .connect(lender)
    .deposit(amount)
    .should.emit(market.lendingPool, 'TokenDeposited')
    .withArgs(await lender.getAddress(), amount, expectedTTokenAmount)
}

export const withdrawWithMarket = (market: GetMarketReturn) => async (
  lender: Signer,
  amount?: BigNumber
) => {
  const lenderAddress = await lender.getAddress()

  // Get expected withdrawal amount with interest
  const expectedWithdrawalAmount = amount
    ? amount
    : await evm.withBlockScope(1, () =>
        market.lendingPool.callStatic.balanceOfUnderlying(lenderAddress)
      )

  const expectedTTokenAmount = await evm.withBlockScope(1, () =>
    market.lendingPool.callStatic.tTokensFromLendingTokens(
      expectedWithdrawalAmount
    )
  )

  // Withdraw loan
  const lp = await market.lendingPool.connect(lender)

  const tx = amount ? await lp.withdraw(amount) : await lp.withdrawAll()

  tx.should
    .emit(market.lendingPool, 'TokenWithdrawn')
    .withArgs(lenderAddress, expectedWithdrawalAmount, expectedTTokenAmount)
}
