// Util classes
const {teller, tokens} = require("../../../scripts/utils/contracts");
const {
  loans: loansActions,
  oracles: oraclesActions,
  tokens: tokensActions,
} = require("../../../scripts/utils/actions");
const {toDecimals} = require("../../../test/utils/consts");

module.exports = async (testContext) => {
  const {accounts, getContracts, collTokenName, tokenName} = testContext;
  console.log(
    "Scenario: Loans#5 - Error taking out loan with invalid supply to debt ratio."
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

  const marketState = await allContracts.lendingPool.getMarketState()
  const maxAmountRequestLoanTerms = toDecimals(1000, tokenInfo.decimals);
  const amountTakeOut = toDecimals(marketState.totalSupplied.toString(), tokenInfo.decimals);
  let initialOraclePrice;
  let collateralAmountDepositCollateral;
  let collateralAmountWithdrawCollateral;
  if (collTokenName.toLowerCase() === "eth") {
    initialOraclePrice = "0.00295835";
    collateralAmountDepositCollateral = toDecimals(5.25, collateralTokenInfo.decimals);
    collateralAmountWithdrawCollateral = toDecimals(0.1, collateralTokenInfo.decimals);
  }
  if (collTokenName.toLowerCase() === "link") {
    initialOraclePrice = "0.100704";
    collateralAmountDepositCollateral = toDecimals(60.1, collateralTokenInfo.decimals);
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
  await loansActions.requestLoanTerms(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {
      loanTermsRequestTemplate,
      loanResponseTemplate,
      expectedErrorMessage: "SUPPLY_TO_DEBT_EXCEEDS_MAX",
    }
  );
};
