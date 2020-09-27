const { minutesToSeconds } = require("../../test/utils/consts");
const {
  loans: loanActions,
  oracles: oracleActions,
  blockchain: blockchainActions
} = require("../utils/actions");

exports.takeOutNewLoan = async function takeOutNewLoan(
  {
    token,
    settings,
    lendingPool,
    loans,
    oracle,
    pairAggregator,
    loanTermsConsensus
  },
  { testContext },
  {
    borrower,
    borrowerTxConfig,
    borrowerTxConfigWithValue,
    initialOraclePrice,
    lenderTxConfig,
    lendingPoolDepositAmountWei,
    amountWei,
    maxAmountWei,
    durationInDays,
    signers,
    secured = true
  }
) {
  const { timer } = testContext;

  await oracleActions.setPrice(
    { oracle, token },
    { txConfig: lenderTxConfig, testContext },
    { price: initialOraclePrice }
  );

  // Deposit tokens on lending pool.
  await loanActions.depositFunds(
    { token, lendingPool },
    { txConfig: lenderTxConfig, testContext },
    { amount: lendingPoolDepositAmountWei }
  );

  // Requesting the loan terms.
  const collateralRatio = secured ? 6000 : 0
  const loanTermsRequestTemplate = {
    amount: amountWei,
    durationInDays,
    borrower
  };
  const loanResponseTemplate = {
    interestRate: 4000,
    collateralRatio,
    maxLoanAmount: maxAmountWei,
    signers,
    responseTime: 50
  };
  const loanInfoRequestLoanTerms = await loanActions.requestLoanTerms(
    { loans, loanTermsConsensus, settings },
    { txConfig: borrowerTxConfigWithValue, testContext },
    { loanTermsRequestTemplate, loanResponseTemplate }
  );

  await blockchainActions.advanceMinutes({ timer }, { testContext }, { minutes: 2 });

  // Take out a loan.
  return await loanActions.takeOutLoan(
    { loans },
    { txConfig: borrowerTxConfig, testContext },
    { loanId: loanInfoRequestLoanTerms.id, amount: amountWei }
  );
};