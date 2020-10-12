const {teller, tokens} = require("../../../scripts/utils/contracts");
const {
  loans: loansActions,
  escrow: escrowActions,
  tokens: tokensActions,
} = require("../../utils/actions");
const helperActions = require("../../utils/actions/helper");
const {toDecimals} = require("../../../test/utils/consts");

module.exports = async (testContext) => {
  const {
    getContracts,
    accounts,
    collTokenName,
    tokenName,
  } = testContext;
  // TODO Add scenario title (from spreadsheet).
  console.log("Scenario: Escrow#1 - .");

  const allContracts = await getContracts.getAllDeployed(
    {teller, tokens},
    tokenName,
    collTokenName
  );
  const {token, collateralToken, loans} = allContracts;
  const tokenInfo = await tokensActions.getInfo({token});
  const collateralTokenInfo = await tokensActions.getInfo({
    token: collateralToken,
  });

  const depositFundsAmount = toDecimals(300, tokenInfo.decimals);
  const maxAmountRequestLoanTerms = toDecimals(100, tokenInfo.decimals);
  const amountTakeOut = toDecimals(50, tokenInfo.decimals);
  let initialOraclePrice;
  let collateralAmountDepositCollateral;
  let collateralAmountWithdrawCollateral;
  if (collTokenName.toLowerCase() === "eth") {
    initialOraclePrice = "0.00295835";
    collateralAmountDepositCollateral = toDecimals(0.2, collateralTokenInfo.decimals);
    collateralAmountWithdrawCollateral = toDecimals(0.1,collateralTokenInfo.decimals);
  }
  if (collTokenName.toLowerCase() === "link") {
    initialOraclePrice = "0.100704";
    collateralAmountDepositCollateral = toDecimals(6.1, collateralTokenInfo.decimals);
    collateralAmountWithdrawCollateral = toDecimals(1, collateralTokenInfo.decimals);
  }
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);
  const borrowerTxConfig = await accounts.getTxConfigAt(1);
  const lenderTxConfig = await accounts.getTxConfigAt(0);

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

  allContracts.escrow = await loansActions.getEscrow(
    allContracts,
    {testContext},
    {
      loanId: loan.id,
    }
  );

  const totalOwed = await loans.getTotalOwed(loan.id);

  await loansActions.getFunds(
    {token: allContracts.token},
    {testContext},
    {amount: loan.interestOwed, to: borrowerTxConfig.from}
  );
  await escrowActions.repay(
    allContracts,
    {
      txConfig: borrowerTxConfig,
      testContext,
    },
    {amount: totalOwed}
  );

  await loansActions.printLoanInfo(
    allContracts,
    { testContext },
    {
      loanId: loan.id,
      collateralTokenInfo,
      tokenInfo,
    }
  );
};
