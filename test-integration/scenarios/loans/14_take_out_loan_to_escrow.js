const BN = require('bignumber.js')

const {teller, tokens} = require("../../../scripts/utils/contracts");
const {
  loans: loansActions,
  tokens: tokensActions,
} = require("../../../scripts/utils/actions");
const {
  loans: loansAssertions,
  tokens: tokensAssertions,
} = require("../../../scripts/utils/assertions")
const loanStatus = require("../../../test/utils/loanStatus")
const helperActions = require("../../../scripts/utils/actions/helper");
const { toDecimals } = require("../../../test/utils/consts");

module.exports = async (testContext) => {
  const {
    getContracts,
    accounts,
    collTokenName,
    tokenName,
  } = testContext;
  console.log("Scenario: Loans#14 - Take out loan to escrow contract.");

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
  const amountTakeOutValue = 50
  const amountTakeOut = toDecimals(amountTakeOutValue, tokenInfo.decimals);
  let initialOraclePrice;
  let collateralAmountDepositCollateral;
  if (collTokenName.toLowerCase() === "eth") {
    initialOraclePrice = "0.00295835";
  }
  if (collTokenName.toLowerCase() === "link") {
    initialOraclePrice = "0.100704";
  }
  const collateralRatio = 6000
  const interestRate = 423
  collateralAmountDepositCollateral = new BN(amountTakeOutValue)
    .plus(new BN(interestRate).div(100).multipliedBy(amountTakeOutValue))
    .multipliedBy(initialOraclePrice)
    .multipliedBy(new BN(collateralRatio).div(10000))
    .toString()
  collateralAmountDepositCollateral = toDecimals(collateralAmountDepositCollateral, collateralTokenInfo.decimals);

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
      collateralRatio,
      durationInDays,
      signers,
      tokenInfo,
      collateralTokenInfo,
    }
  )

  await loansAssertions.assertLoanValues(
    allContracts,
    { testContext },
    {
      id: loan.id,
      status: loanStatus.Active,
      hasEscrow: true
    }
  )

  await tokensAssertions.balanceIs(
    allContracts,
    { testContext },
    {
      address: loan.escrow,
      expectedBalance: loan.borrowedAmount.toString()
    }
  )

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
