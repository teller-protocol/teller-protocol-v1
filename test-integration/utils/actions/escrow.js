const assert = require("assert");
const truffleAssert = require('truffle-assertions')
const BigNumber = require("bignumber.js");

const loanStatus = require("../../../test/utils/loanStatus");
const loansActions = require("./loans");
const {
  tokens: tokensAssertions,
  escrow: escrowAssertions,
  loans: loansAssertions
} = require("../assertions");
const {
  escrow: escrowEvents,
  uniswap: uniswapEvents,
  compound: compoundEvents
} = require("../../../test/utils/events");
const { teller } = require("../../../scripts/utils/contracts");
const logicNames = require("../../../test/utils/logicNames");

/**
 * Repays the loan for an amount.
 * Requires the borrowed token instance to set an approval.
 */
const repay = async (
  { escrow, token, loans },
  { txConfig, testContext },
  { amount, shouldFail = false, expectedRevertReason }
) => {
  console.log(`Repaying ${amount} in escrow ${escrow.address}...`);

  await token.approve(escrow.address, amount, txConfig);
  const txPromise = escrow.repay(amount, txConfig);
  await escrowAssertions.loanRepaid(
    { escrow, loans },
    { txConfig, testContext },
    { txPromise, amount, shouldFail, expectedRevertReason }
  );
};

async function repayInFull(
  { escrow, token, loans },
  { txConfig, testContext },
  { shouldFail, expectedRevertReason } = {}
) {
  const loan = await escrow.getLoan.call();
  const totalOwed = await loans.getTotalOwed(loan.id);
  await loansActions.getFunds(
    { token },
    { testContext },
    { amount: loan.interestOwed, to: txConfig.from }
  );
  await repay(
    { escrow, token, loans },
    { txConfig, testContext },
    { amount: totalOwed, shouldFail, expectedRevertReason }
  );

  let status
  if (shouldFail) status = loanStatus.Active
  await loansAssertions.assertLoanValues(
    { loans },
    { testContext },
    { id: loan.id, status }
  );
}

/**
 * Claims the tokens in the escrow using the loan id.
 */
const claimTokensByLoanId = async (
  { loans },
  { txConfig, testContext },
  { loanId, recipient, shouldFail = false, expectedRevertReason }
) => {
  const escrow = await loansActions.getEscrow({ loans }, { testContext }, { loanId });
  const txPromise = escrow.claimTokens(recipient, txConfig);
  await escrowAssertions.tokensClaimed({ txPromise, recipient, shouldFail, expectedRevertReason });
};

/**
 * Claims the tokens in the escrow once the loan is closed.
 */
const claimTokens = async (
  { escrow },
  { txConfig, testContext },
  { recipient, shouldFail = false, expectedRevertReason }
) => {
  const txPromise = escrow.claimTokens(recipient, txConfig);
  await escrowAssertions.tokensClaimed({ txPromise, recipient, shouldFail, expectedRevertReason });
};

const callDapp = async (
  { escrow },
  { txConfig, testContext },
  { dappName, fnName, args }
) => {
  const { address: location, contract: dappContract } = await testContext.getContracts.getDeployed(teller.proxy(dappName));
  const dappData = {
    location,
    data: dappContract.methods[fnName](...args).encodeABI()
  };
  return escrow.callDapp(dappData, txConfig);
};

/**
 * Use the Uniswap Dapp to swap a token using the funds in an Escrow.
 * @returns number - Balance of the destination token if swap was successful
 */
const uniswapSwap = async (
  { escrow },
  { txConfig, testContext },
  { tokensPath, sourceAmount, minDestination, shouldFail = false, expectedRevertReason }
) => {
  const tokenA = tokensPath[0];
  const tokenB = tokensPath[tokensPath.length - 1];
  const tokenABalanceBefore = (await tokenA.balanceOf(escrow.address)).toString();
  const tokenBBalanceBefore = (await tokenB.balanceOf(escrow.address)).toString();

  const path = tokensPath.map(({ address }) => address);
  const args = [ path, sourceAmount, minDestination ];
  const fn = callDapp(
    { escrow },
    { txConfig, testContext },
    { dappName: logicNames.Uniswap, fnName: "swap", args }
  );

  if (shouldFail) {
    try {
      await assert.rejects(fn, "Expected swap to fail");
    } catch (error) {
      assert.strictEqual(error.reason, expectedRevertReason, error.message);
    }
  } else {
    await assert.doesNotReject(fn, "Expected swap to be successful");

    const swapResult = await fn
    const uniswap = await testContext.getContracts.getDeployed(teller.proxy('Uniswap', escrow.address));
    const txResult = await truffleAssert.createTransactionResult(uniswap, swapResult.tx)
    uniswapEvents
      .uniswapSwapped(txResult)
      .emitted(tokenA.address, tokenB.address, sourceAmount);

    await tokensAssertions.balanceLt(
      { token: tokenA },
      { testContext },
      { address: escrow.address, maxBalance: tokenABalanceBefore }
    );
    const minDestinationBalance = new BigNumber(tokenBBalanceBefore).plus(minDestination);
    await tokensAssertions.balanceGt(
      { token: tokenB },
      { testContext },
      { address: escrow.address, minBalance: minDestinationBalance.toString() }
    );
  }
};

/**
 * Use the Compound Dapp to lend a token using the funds in an Escrow.
 */
const compoundLend = async (
  { escrow, token, cToken },
  { txConfig, testContext },
  { amount }
) => {
  const tokenBalanceBefore = (await token.balanceOf(escrow.address)).toString();
  const cTokenBalanceBefore = (await cToken.balanceOf(escrow.address)).toString();

  const args = [ token.address, amount ];
  const lendResult = await callDapp(
    { escrow },
    { txConfig, testContext },
    { dappName: logicNames.Compound, fnName: "lend", args }
  );

  const tokenBalanceAfter = (await token.balanceOf(escrow.address)).toString();
  const cTokenBalanceAfter = (await cToken.balanceOf(escrow.address)).toString();

  const compound = await testContext.getContracts.getDeployed(teller.proxy('Compound', escrow.address));
  const txResult = await truffleAssert.createTransactionResult(compound, lendResult.tx)
  compoundEvents
    .compoundLended(txResult)
    .emitted(token.address, cToken.address, amount, tokenBalanceAfter, cTokenBalanceAfter);

  await tokensAssertions.balanceLt(
    { token },
    { testContext },
    { address: escrow.address, maxBalance: tokenBalanceBefore }
  );
  await tokensAssertions.balanceGt(
    { token: cToken },
    { testContext },
    { address: escrow.address, minBalance: cTokenBalanceBefore }
  );
};

/**
 * Use the Compound Dapp to redeem a token being lent using the funds in an Escrow.
 */
const compoundRedeem = async (
  { escrow, token, cToken },
  { txConfig, testContext },
  { amount, shouldFail = false, expectedRevertReason }
) => {
  const tokenBalanceBefore = (await token.balanceOf(escrow.address)).toString();
  const cTokenBalanceBefore = (await cToken.balanceOf(escrow.address)).toString();

  const args = [ token.address, amount ];
  const fn = callDapp(
    { escrow },
    { txConfig, testContext },
    { dappName: logicNames.Compound, fnName: "redeem", args }
  );

  if (shouldFail) {
    try {
      await assert.rejects(fn, "Expected redeem to fail");
    } catch (error) {
      assert.strictEqual(error.reason, expectedRevertReason, error.message);
    }
  } else {
    await assert.doesNotReject(fn, "Expected redeem to be successful");

    const redeemResult = await fn

    const tokenBalanceAfter = (await token.balanceOf(escrow.address)).toString();
    const cTokenBalanceAfter = (await cToken.balanceOf(escrow.address)).toString();

    const compound = await testContext.getContracts.getDeployed(teller.proxy('Compound', escrow.address));
    const txResult = await truffleAssert.createTransactionResult(compound, redeemResult.tx)
    compoundEvents
      .compoundRedeemed(txResult)
      .emitted(token.address, cToken.address, amount, true, tokenBalanceAfter, cTokenBalanceAfter);

    await tokensAssertions.balanceLt(
      { token: cToken },
      { testContext },
      { address: escrow.address, maxBalance: cTokenBalanceBefore }
    );
    await tokensAssertions.balanceIs(
      { token },
      { testContext },
      { address: escrow.address, expectedBalance: new BigNumber(tokenBalanceBefore).plus(amount).toString() }
    );
  }
};

/**
 * Use the Compound Dapp to redeem the full balance of a token being lent using the funds in an Escrow.
 */
const compoundRedeemAll = async (
  { escrow, token, cToken },
  { txConfig, testContext }
) => {
  const tokenBalanceBefore = (await token.balanceOf(escrow.address)).toString();
  const cTokenBalanceBefore = (await cToken.balanceOf(escrow.address)).toString();

  const args = [ token.address ];
  const redeemResult = await callDapp(
    { escrow },
    { txConfig, testContext },
    { dappName: logicNames.Compound, fnName: "redeemAll", args }
  );

  const tokenBalanceAfter = (await token.balanceOf(escrow.address)).toString();
  const cTokenBalanceAfter = (await cToken.balanceOf(escrow.address)).toString();

  const compound = await testContext.getContracts.getDeployed(teller.proxy('Compound', escrow.address));
  const txResult = await truffleAssert.createTransactionResult(compound, redeemResult.tx)
  compoundEvents
    .compoundRedeemed(txResult)
    .emitted(token.address, cToken.address, cTokenBalanceBefore, false, tokenBalanceAfter, cTokenBalanceAfter);

  await tokensAssertions.balanceIs(
    { token: cToken },
    { testContext },
    { address: escrow.address, expectedBalance: "0" }
  );
  await tokensAssertions.balanceGt(
    { token },
    { testContext },
    { address: escrow.address, minBalance: tokenBalanceBefore }
  );
};

module.exports = {
  repay,
  repayInFull,
  claimTokens,
  claimTokensByLoanId,
  dapp: {
    uniswap: {
      swap: uniswapSwap
    },
    compound: {
      lend: compoundLend,
      redeem: compoundRedeem,
      redeemAll: compoundRedeemAll
    }
  }
};
