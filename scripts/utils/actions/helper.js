const {
  loans: loansActions,
  blockchain: blockchainActions,
} = require("./index");

const chainlinkActions = require("./chainlink");

const takeOutNewLoan = async function (
  allContracts,
  { testContext },
  {
    borrowerTxConfig,
    oraclePrice,
    lenderTxConfig,

    depositFundsAmount,
    maxAmountRequestLoanTerms,
    amountTakeOut,
    collateralAmountDepositCollateral,
    secured = true,

    durationInDays,
    signers,
    tokenInfo,
    collateralTokenInfo,
  }
) {
  const { timer } = testContext;

  await chainlinkActions.setPrice(
    allContracts,
    { txConfig: lenderTxConfig, testContext },
    { price: oraclePrice }
  );
  await loansActions.printPairAggregatorInfo(
    allContracts,
    { testContext },
    { tokenInfo, collateralTokenInfo }
  );

  // Deposit tokens on lending pool.
  await loansActions.depositFunds(
    allContracts,
    { txConfig: lenderTxConfig, testContext },
    { amount: depositFundsAmount }
  );

  // Requesting the loan terms.
  const collateralRatio = secured ? 6000 : 0
  const loanTermsRequestTemplate = {
    amount: amountTakeOut,
    durationInDays,
    borrower: borrowerTxConfig.from,
  };
  const loanResponseTemplate = {
    interestRate: 4000,
    collateralRatio,
    maxLoanAmount: maxAmountRequestLoanTerms,
    signers,
    responseTime: 50
  };
  const loanInfoRequestLoanTerms = await loansActions.requestLoanTerms(
    allContracts,
    { txConfig: borrowerTxConfig, testContext },
    { loanTermsRequestTemplate, loanResponseTemplate }
  );

  // Depositing collateral.
  await loansActions.depositCollateral(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: collateralAmountDepositCollateral}
  );

  await blockchainActions.advanceMinutes({ timer }, { testContext }, { minutes: 2 });

  await loansActions.printLoanInfo(
    allContracts,
    { testContext },
    {
      loanId: loanInfoRequestLoanTerms.id,
      collateralTokenInfo,
      tokenInfo,
    }
  );

  // Take out a loan.
  return await loansActions.takeOutLoan(
    allContracts,
    { txConfig: borrowerTxConfig, testContext },
    { loanId: loanInfoRequestLoanTerms.id, amount: amountTakeOut }
  );
};

module.exports = {
  takeOutNewLoan,
};
