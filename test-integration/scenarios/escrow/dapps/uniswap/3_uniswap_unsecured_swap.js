const { teller, tokens } = require("../../../../../scripts/utils/contracts");
const {
  loans: loansActions,
  escrow: escrowActions,
  tokens: tokensActions,
} = require("../../../../utils/actions");
const { toDecimals } = require("../../../../../test/utils/consts");
const helperActions = require("../../../../utils/actions/helper");

module.exports = async (testContext) => {
  const {
    getContracts,
    accounts,
    collTokenName,
    tokenName,
  } = testContext;
  // TODO Add scenario title (from spreadsheet).
  console.log("Scenario: Dapp#1 - .");
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

  const depositFundsAmount = toDecimals(300, tokenInfo.decimals);
  const maxAmountRequestLoanTerms = toDecimals(100, tokenInfo.decimals);
  const amountTakeOut = toDecimals(50, tokenInfo.decimals);
  let initialOraclePrice;
  let collateralAmountDepositCollateral;
  let collateralAmountWithdrawCollateral;
  if (collTokenName.toLowerCase() === "eth") {
    initialOraclePrice = toDecimals("0.00295835", 18);
    collateralAmountDepositCollateral = toDecimals(0.2, collateralTokenInfo.decimals);
    collateralAmountWithdrawCollateral = toDecimals(0.1,collateralTokenInfo.decimals);
  }
  if (collTokenName.toLowerCase() === "link") {
    initialOraclePrice = toDecimals("0.100704", 8);
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
      secured: false,
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

  const context = { testContext, txConfig: borrowerTxConfig };

  const destinationTokenName = collateralTokenInfo.symbol === 'ETH' ? 'WETH' : collateralTokenInfo.symbol;
  const destinationToken = await getContracts.getDeployed(tokens.get(destinationTokenName));
  const tokensPath = [ token, destinationToken ]
  const sourceAmount = loan.borrowedAmount.toString()
  const minDestination = '100000000000000000'
  await escrowActions.dapp.uniswap.swap(allContracts, context,
    { tokensPath, sourceAmount, minDestination, shouldFail: true, expectedRevertReason: 'DAPP_UNSECURED_NOT_ALLOWED' }
  )
};