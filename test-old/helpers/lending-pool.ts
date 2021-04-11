import { evm } from 'hardhat'
import { BigNumber, Signer } from 'ethers'
import chai from 'chai'
import { solidity } from 'ethereum-waffle'

import { GetMarketReturn } from '../../tasks'

chai.use(solidity)

/**
 * Creates all LP test helper functions.
 * @param market {GetMarketReturn}
 */
export const getLPHelpers = (market: GetMarketReturn) => ({
  deposit: depositWithMarket(market),
  withdraw: withdrawWithMarket(market),
  createLoan: creatLoanWithMarket(market),
  repay: repayWithMarket(market),
})

/**
 * Factory function to create a test LP helper to easily deposit and verify
 * state changes.
 * @param market {GetMarketReturn}
 */
export const depositWithMarket = (market: GetMarketReturn) =>
  /**
   * LendingPool helper function for testing the deposit functionality.
   *  - Approves the lending token amount for the lender.
   *  - Calculates the expected amount of TTokens to be received.
   *  - Calls the LP deposit function.
   *  - Verifies event was called with expected arguments.
   * @param lender {Signer} Signer to call the LP as.
   * @param amount {BigNumber} An amount of tokens to deposit.
   */
  async (lender: Signer, amount: BigNumber) => {
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

/**
 * Factory function to create a test LP helper to easily withdraw and verify
 * state changes.
 * @param market {GetMarketReturn}
 */
export const withdrawWithMarket = (market: GetMarketReturn) =>
  /**
   * LendingPool helper function for testing the withdraw functionality.
   *  - Estimates the exact amount of tokens to be withdrawn/burned.
   *  - Calls the LP withdraw/withdrawAll function.
   *    - If no amount is specified, the withdrawALl function is called.
   *  - Verifies event was called with expected values.
   * @param lender {Signer} Signer to call the LP as.
   * @param amount {BigNumber} Optional amount to withdraw. Defaults to withdraw all.
   */
  async (lender: Signer, amount?: BigNumber) => {
    const lenderAddress = await lender.getAddress()

    // Get expected withdrawal amount with interest
    const expectedWithdrawalAmount = amount
      ? amount
      : await evm.withBlockScope(1, () =>
          market.lendingPool.callStatic.balanceOfUnderlying(lenderAddress)
        )

    // Get expected TToken amount to be burned
    const expectedTTokenAmount = await evm.withBlockScope(1, () =>
      market.lendingPool.callStatic.tTokensFromLendingTokens(
        expectedWithdrawalAmount
      )
    )

    // Connect the lender
    const lp = await market.lendingPool.connect(lender)

    // Withdraw loan
    const tx = amount ? await lp.withdraw(amount) : await lp.withdrawAll()

    // Verify event
    tx.should
      .emit(market.lendingPool, 'TokenWithdrawn')
      .withArgs(lenderAddress, expectedWithdrawalAmount, expectedTTokenAmount)
  }

/**
 * Factory function to create a test LP helper to easily send funds.
 * @param market {GetMarketReturn}
 */
export const creatLoanWithMarket = (market: GetMarketReturn) =>
  /**
   * Helper for sending funds from the LP to a borrower address.
   *  - Verifies that the market state variables have been appropriately updated.
   *  - Calls the LP createLoan function as the caller parameter.
   * @param borrower {Signer} The Signer to send funds to.
   * @param amount {BigNumber} An amount of funds to transfer.
   * @param caller {Signer} The Signer to call the function as.
   */
  async (borrower: Signer, amount: BigNumber, caller: Signer) => {
    // Grab the market state before transferring funds
    const marketStateBefore = await market.lendingPool.callStatic.getMarketStateCurrent()

    // Transfer funds from the LP
    await market.lendingPool
      .connect(caller)
      .createLoan(amount, await borrower.getAddress())

    // Check that the market state has been updated and funds have been transferred
    const marketStateAfter = await market.lendingPool.callStatic.getMarketStateCurrent()
    const expectedTotalBorrowed = marketStateBefore.totalBorrowed.add(amount)
    expectedTotalBorrowed.should.eql(
      marketStateAfter.totalBorrowed,
      'LendingPool did not lend out funds'
    )
  }

/**
 * Factory function to create a test LP helper to easily repay funds.
 * @param market {GetMarketReturn}
 */
export const repayWithMarket = (market: GetMarketReturn) =>
  /**
   * Helper for repaying funds to the LP for a borrower address.
   *  - Approves the lending token amount to repay from the borrower.
   *  - Calls the repay function from the caller.
   *  - Verifies that the market state variables have been appropriately updated.
   *  - Verifies the global interest earned variable has been appropriately updated.
   * @param borrower {Signer} The Signer to transfer funds from.
   * @param principal {BigNumber} The amount to repay that counts toward a loan's principal amount.
   * @param interest {BigNumber} The amount to repay that counts toward a loan's interest amount.
   * @param caller {Signer} The Signer to call the function as.
   */
  async (
    borrower: Signer,
    principal: BigNumber,
    interest: BigNumber,
    caller: Signer
  ) => {
    // Grab the market state before repaying funds
    const marketStateBefore = await market.lendingPool.callStatic.getMarketStateCurrent()
    // Grab the current interest earned before repaying funds
    const interestEarnedBefore = await market.lendingPool.totalInterestEarned()

    // Approve amount to repay
    await market.lendingToken
      .connect(borrower)
      .approve(market.lendingPool.address, principal.add(interest))

    // Repay funds to the LP
    await market.lendingPool
      .connect(caller)
      .repay(principal, interest, await borrower.getAddress())

    // Check that the market state has been updated and funds have been repaid
    const marketStateAfter = await market.lendingPool.callStatic.getMarketStateCurrent()
    const expectedRepaidAmount = marketStateBefore.totalRepaid.add(principal)
    expectedRepaidAmount.should.eql(
      marketStateAfter.totalRepaid,
      'Incorrect principal amount of funds repaid'
    )

    // Check the correct amount of interest has been marked as earned
    const interestEarnedAfter = await market.lendingPool.totalInterestEarned()
    interestEarnedBefore
      .add(interest)
      .should.eql(interestEarnedAfter, 'Incorrect amount of interest earned')
  }
