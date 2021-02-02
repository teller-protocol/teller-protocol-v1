// Util classes
const {teller, tokens} = require("../../../scripts/utils/contracts");
const {
  loans: loansActions,
  oracles: oraclesActions,
  tokens: tokensActions,
  blockchain: blockchainActions,
} = require("../../../scripts/utils/actions");
const {toDecimals} = require("../../../test-old/utils/consts");

module.exports = async (testContext) => {
  const {accounts, getContracts, collTokenName, timer, tokenName} = testContext;
  console.log(
    "Scenario: Loans#7 - Error taking out loan greater than max loan amount allowed from terms."
  );
  const allContracts = await getContracts.getAllDeployed(
    {teller, tokens},
    tokenName,
    collTokenName
  );
  const {token, collateralToken} = allContracts;
  const tokenInfo = await tokensActions.getInfo({token});
  const collateralTokenInfo = await tokensActions.getInfo({
    token: collateralToken,
  });

  const depositFundsAmount = toDecimals(500, tokenInfo.decimals);
  const maxAmountRequestLoanTerms = toDecimals(100, tokenInfo.decimals);
  const amountTakeOut = toDecimals(101, tokenInfo.decimals);
  let initialOraclePrice;
  let collateralAmountDepositCollateral;
  let collateralAmountWithdrawCollateral;
  if (collTokenName.toLowerCase() === "eth") {
    initialOraclePrice = "0.00295835";
    collateralAmountDepositCollateral = toDecimals(3.25, collateralTokenInfo.decimals);
    collateralAmountWithdrawCollateral = toDecimals(0.1, collateralTokenInfo.decimals);
  }
  if (collTokenName.toLowerCase() === "link") {
    initialOraclePrice = "0.100704";
    collateralAmountDepositCollateral = toDecimals(7.1, collateralTokenInfo.decimals);
    collateralAmountWithdrawCollateral = toDecimals(0.2, collateralTokenInfo.decimals);
  }
  const durationInDays = 10;
  const signers = await accounts.getAllAt(12, 13);
  const borrowerTxConfig = await accounts.getTxConfigAt(1);
  const lenderTxConfig = await accounts.getTxConfigAt(0);

  // Sets Initial Oracle Price
  await oraclesActions.setPrice(
    allContracts,
    {testContext},
    {price: initialOraclePrice}
  );
  await loansActions.printPairAggregatorInfo(
    allContracts,
    {testContext},
    {tokenInfo, collateralTokenInfo}
  );

  // Deposit tokens on lending pool.
  await loansActions.depositFunds(
    allContracts,
    {txConfig: lenderTxConfig, testContext},
    {amount: depositFundsAmount}
  );

  // Requesting the loan terms.
  const loanTermsRequestTemplate = {
    amount: amountTakeOut,
    durationInDays,
    borrower: borrowerTxConfig.from,
  };
  const loanResponseTemplate = {
    interestRate: 4000,
    collateralRatio: 6000,
    maxLoanAmount: maxAmountRequestLoanTerms,
    signers,
    responseTime: 50,
  };
  const loanInfoRequestLoanTerms = await loansActions.requestLoanTerms(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {
      loanTermsRequestTemplate,
      loanResponseTemplate,
    }
  );

  // Depositing collateral.
  await loansActions.depositCollateral(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {
      loanId: loanInfoRequestLoanTerms.id,
      amount: collateralAmountDepositCollateral,
    }
  );

  await blockchainActions.advanceMinutes({timer}, {testContext}, {minutes: 2});

  await loansActions.printLoanInfo(
    allContracts,
    {testContext},
    {
      loanId: loanInfoRequestLoanTerms.id,
      collateralTokenInfo,
      tokenInfo,
    }
  );

  // Take out a loan.
  await loansActions.takeOutLoan(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {
      loanId: loanInfoRequestLoanTerms.id,
      amount: amountTakeOut,
      expectedErrorMessage: "MAX_LOAN_EXCEEDED",
    }
  );
};
