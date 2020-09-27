const assert = require('assert')

const loansActions = require("./loans");
const {
  tokens: tokensAssertions
} = require('../assertions')
const {
  escrow: escrowEvents,
  uniswap: uniswapEvents,
  compound: compoundEvents
} = require("../../../test/utils/events");
const { teller, tokens } = require("../../../scripts/utils/contracts");
const logicNames = require("../../../test/utils/logicNames");

/**
 * Repays the loan for an amount.
 * Requires the borrowed token instance to set an approval.
 */
const repay = async (
  { escrow, token },
  { txConfig, testContext },
  { amount }
) => {
  await token.approve(escrow.address, amount, txConfig);
  const escrowResult = await escrow.repay(amount, txConfig);
  return escrowResult;
};

/**
 * Claims the tokens in the escrow using the loan id.
 */
const claimTokensByLoanId = async (
  { loans },
  { txConfig, testContext },
  { loanId, recipient }
) => {
  const escrowInstance = await loansActions.getEscrow({loans}, {testContext}, {loanId});
  const claimTokensResult = await escrowInstance.claimTokens(recipient, txConfig);
  escrowEvents
    .tokensClaimed(claimTokensResult)
    .emitted(recipient);
  // TODO Assert balances.
  return claimTokensResult;
};

/**
 * Claims the tokens in the escrow once the loan is closed.
 */
const claimTokens = async (
  { escrow },
  { txConfig, testContext },
  { recipient }
) => {
  const claimTokensResult = await escrow.claimTokens(recipient, txConfig);
  escrowEvents
    .tokensClaimed(claimTokensResult)
    .emitted(recipient);
  return claimTokensResult;
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
  const { getContracts } = testContext;
  const { address: uniswapDappAddress, contract: uniswapDapp  } = await getContracts.getDeployed(
    teller.escrowDapp(logicNames.Uniswap)
  );
  const path = tokensPath.map(({ address }) => address)
  const dappData = {
    location: uniswapDappAddress,
    data: uniswapDapp.methods.swap(path, sourceAmount, minDestination).encodeABI()
  };
  const fn = escrow.callDapp(dappData, txConfig);

  if (shouldFail) {
    try {
      await assert.rejects(fn, 'Expected swap to fail')
    } catch (error) {
      assert.strictEqual(error.reason, expectedRevertReason);
    }
  } else {
    await assert.doesNotReject(fn, 'Expected swap to be successful')

    const balance = await tokensAssertions.balanceGt(
      { token: tokensPath[tokensPath.length - 1] },
      { testContext },
      { address: escrow.address, minBalance: minDestination }
    )

    // const sourceTokenAddress = path[0];
    // const destinationTokenAddress = path[path.length - 1];
    // uniswapEvents
    //   .uniswapSwapped(swapResult)
    //   .emitted(txConfig.from, escrow.address, sourceTokenAddress, destinationTokenAddress, sourceAmount);

    return balance;
  }
};

/**
 * Use the Compound Dapp to lend a token using the funds in an Escrow.
 */
const compoundLend = async (
  { escrow },
  { txConfig, testContext },
  { cTokenAddress, amount }
) => {
  const { getContracts } = testContext;
  const compoundDapp = await getContracts.getDeployed(
    teller.escrowDapp(logicNames.Compound)
  );
  const lendResult = await compoundDapp.lend(cTokenAddress, amount, txConfig);

  // TODO: get token instances to fetch balances
  // compoundEvents
  //   .compoundLended(lendResult)
  //   .emitted(txConfig.from, escrow.address, amount, cTokenAddress, cTokenBalance, underlyingTokenAddress, underlyingTokenBalance);

  return lendResult;
};

/**
 * Use the Compound Dapp to redeem a token being lent using the funds in an Escrow.
 */
const compoundRedeem = async (
  { escrow },
  { txConfig, testContext },
  { cTokenAddress, amount }
) => {
  const { getContracts } = testContext;
  const compoundDapp = await getContracts.getDeployed(
    teller.escrowDapp(logicNames.Compound)
  );
  const redeemResult = await compoundDapp.redeem(cTokenAddress, amount, txConfig);

  // TODO: get token instances to fetch balances
  // compoundEvents
  //   .compoundRedeemed(redeemResult)
  //   .emitted(txConfig.from, escrow.address, amount, cTokenAddress, cTokenBalance, underlyingTokenAddress, underlyingTokenBalance);

  return redeemResult;
};

/**
 * Use the Compound Dapp to redeem the full balance of a token being lent using the funds in an Escrow.
 */
const compoundRedeemAll = async (
  { escrow },
  { txConfig, testContext },
  { cTokenAddress }
) => {
  const { getContracts } = testContext;
  const compoundDapp = await getContracts.getDeployed(
    teller.escrowDapp(logicNames.Compound)
  );
  const redeemResult = await compoundDapp.redeemAll(cTokenAddress, txConfig);

  // TODO: get token instances to fetch balances
  // compoundEvents
  //   .compoundRedeemed(redeemResult)
  //   .emitted(txConfig.from, escrow.address, amount, cTokenAddress, cTokenBalance, underlyingTokenAddress, underlyingTokenBalance);

  return redeemResult;
};

module.exports = {
  repay,
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
