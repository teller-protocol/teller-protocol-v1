// Util classes
const {teller, tokens} = require("../../../scripts/utils/contracts");
const {
  loans: loansActions,
  tokens: tokensActions,
  oracles: oraclesActions,
} = require("../../../scripts/utils/actions");
const helperActions = require("../../../scripts/utils/actions/helper");
const {toDecimals} = require("../../../test-old/utils/consts");

module.exports = async (testContext) => {
  const {
    accounts,
    getContracts,
    collTokenName,
    tokenName,
  } = testContext;
  console.log(
    "Scenario: Loans#10 - Liquidate loan due to under collateralized."
  );

  const allContracts = await getContracts.getAllDeployed(
    {teller, tokens},
    tokenName,
    collTokenName
  );
  const {token, collateralToken } = allContracts;
  const tokenInfo = await tokensActions.getInfo({token});
  const collateralTokenInfo = await tokensActions.getInfo({
    token: collateralToken,
  });

  const depositFundsAmount = toDecimals(500, tokenInfo.decimals);
  const maxAmountRequestLoanTerms = toDecimals(200, tokenInfo.decimals);
  const amountTakeOut = toDecimals(100, tokenInfo.decimals);
  const amountLiquidateLoan = toDecimals(100, tokenInfo.decimals);
  let initialOraclePrice;
  let finalOraclePrice;
  let collateralAmountDepositCollateral;
  if (collTokenName.toLowerCase() === "eth") {
    initialOraclePrice = "0.00295835";
    finalOraclePrice = toDecimals("0.63655835", 18);
    collateralAmountDepositCollateral = toDecimals(1.18, collateralTokenInfo.decimals);
  }
  if (collTokenName.toLowerCase() === "link") {
    initialOraclePrice = "0.100704";
    finalOraclePrice = toDecimals("10000.001704", 8);
    collateralAmountDepositCollateral = toDecimals(16.1, collateralTokenInfo.decimals);
  }
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);
  const borrowerTxConfig = await accounts.getTxConfigAt(1);
  const lenderTxConfig = await accounts.getTxConfigAt(0);
  const liquidatorTxConfig = await accounts.getTxConfigAt(2);

  const loan = await helperActions.takeOutNewLoan(
    allContracts,
    {testContext},
    {
      borrowerTxConfig,
      oraclePrice: initialOraclePrice,
      lenderTxConfig,
      depositFundsAmount,
      maxAmountRequestLoanTerms,
      amountTakeOut,
      collateralAmountDepositCollateral,
      durationInDays,
      signers,
      tokenInfo,
      collateralTokenInfo,
    }
  );

  await loansActions.printLoanInfo(
    allContracts,
    {testContext},
    {
      loanId: loan.id,
      collateralTokenInfo,
      tokenInfo,
    }
  );

  await oraclesActions.setPrice(
    allContracts,
    { testContext },
    { price: finalOraclePrice }
  );
  await loansActions.printPairAggregatorInfo(
    allContracts,
    { testContext },
    { tokenInfo, collateralTokenInfo }
  );

  await loansActions.printLoanInfo(
    allContracts,
    {testContext},
    {
      loanId: loan.id,
      collateralTokenInfo,
      tokenInfo,
    }
  );

  await loansActions.liquidateLoan(
    allContracts,
    {testContext, txConfig: liquidatorTxConfig},
    {
      loanId: loan.id,
      amount: amountLiquidateLoan,
    }
  );
};
