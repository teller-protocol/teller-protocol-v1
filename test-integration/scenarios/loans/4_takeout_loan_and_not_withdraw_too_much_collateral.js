// Util classes
const { teller, tokens } = require('../../../scripts/utils/contracts');
const {
  loans: loansActions,
  tokens: tokensActions,
} = require('../../../scripts/utils/actions');
const helperActions = require('../../../scripts/utils/actions/helper');
const { toDecimals } = require('../../../test/utils/consts');

module.exports = async (testContext) => {
  const { accounts, getContracts, collTokenName, tokenName } = testContext;
  console.log(
    'Scenario: Loans#4 - Error taking out loan and take out too much collateral.'
  );
  const allContracts = await getContracts.getAllDeployed(
    { teller, tokens },
    tokenName,
    collTokenName
  );
  const { token, collateralToken } = allContracts;
  const tokenInfo = await tokensActions.getInfo({ token });
  const collateralTokenInfo = await tokensActions.getInfo({
    token: collateralToken,
  });

  const depositFundsAmount = toDecimals(500, tokenInfo.decimals);
  const maxAmountRequestLoanTerms = toDecimals(100, tokenInfo.decimals);
  const amountTakeOut = toDecimals(100, tokenInfo.decimals);
  let initialOraclePrice;
  let collateralAmountDepositCollateral;
  let collateralAmountWithdrawCollateral;
  if (collTokenName.toLowerCase() === 'eth') {
    initialOraclePrice = '0.00295835';
    collateralAmountDepositCollateral = toDecimals(1.25, collateralTokenInfo.decimals);
    collateralAmountWithdrawCollateral = toDecimals(2.1, collateralTokenInfo.decimals);
  }
  if (collTokenName.toLowerCase() === 'link') {
    initialOraclePrice = '0.100704';
    collateralAmountDepositCollateral = toDecimals(16.1, collateralTokenInfo.decimals);
    collateralAmountWithdrawCollateral = toDecimals(18, collateralTokenInfo.decimals);
  }
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);
  const borrowerTxConfig = await accounts.getTxConfigAt(1);
  const lenderTxConfig = await accounts.getTxConfigAt(0);

  const loan = await helperActions.takeOutNewLoan(
    allContracts,
    { testContext },
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
    { testContext },
    {
      loanId: loan.id,
      collateralTokenInfo,
      tokenInfo,
    }
  );

  await loansActions.withdrawCollateral(
    allContracts,
    {
      testContext,
      txConfig: borrowerTxConfig,
    },
    {
      loanId: loan.id,
      amount: collateralAmountWithdrawCollateral,
      expectedErrorMessage: 'COLLATERAL_AMOUNT_TOO_HIGH',
    }
  );
};
