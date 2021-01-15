// Util classes
const { teller, tokens } = require('../../../scripts/utils/contracts');
const {
  loans: loansActions,
  oracles: oraclesActions,
  tokens: tokensActions,
  settings: settingsActions,
} = require('../../../scripts/utils/actions');
const { toDecimals } = require('../../../test/utils/consts');
const platformSettingsNames = require('../../../test/utils/platformSettingsNames');

module.exports = async (testContext) => {
  const { accounts, getContracts, collTokenName, tokenName } = testContext;
  console.log(
    'Scenario: Loans#6 - Error taking out loan in too short amount of time (from request loan terms).'
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

  const depositFundsAmount = toDecimals(250, tokenInfo.decimals);
  const maxAmountRequestLoanTerms = toDecimals(50, tokenInfo.decimals);
  const amountTakeOut = toDecimals(50, tokenInfo.decimals);
  let initialOraclePrice;
  let collateralAmountDepositCollateral;
  if (collTokenName.toLowerCase() === 'eth') {
    initialOraclePrice = '0.00295835';
    collateralAmountDepositCollateral = toDecimals(0.2, collateralTokenInfo.decimals);
  }
  if (collTokenName.toLowerCase() === 'link') {
    initialOraclePrice = '0.100704';
    collateralAmountDepositCollateral = toDecimals(6.1, collateralTokenInfo.decimals);
  }
  const durationInDays = 10;
  const signers = await accounts.getAllAt(12, 13);
  const borrowerTxConfig = await accounts.getTxConfigAt(1);
  const lenderTxConfig = await accounts.getTxConfigAt(0);
  const ownerTxConfig = await accounts.getTxConfigAt(0);
  const safetyIntervalSeconds = 1300;
  const initialSafetyIntervalSetting = await settingsActions.getPlatformSettings(
    allContracts,
    { testContext },
    { settingName: platformSettingsNames.SafetyInterval }
  );

  await settingsActions.updatePlatformSettings(
    allContracts,
    { testContext, txConfig: ownerTxConfig },
    {
      settingName: platformSettingsNames.SafetyInterval,
      newValue: safetyIntervalSeconds,
    }
  );

  // Sets Initial Oracle Price
  await oraclesActions.setPrice(
    allContracts,
    { testContext },
    { price: initialOraclePrice }
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
    { txConfig: borrowerTxConfig, testContext },
    {
      loanTermsRequestTemplate,
      loanResponseTemplate,
    }
  );

  // Depositing collateral.
  await loansActions.depositCollateral(
    allContracts,
    { txConfig: borrowerTxConfig, testContext },
    {
      loanId: loanInfoRequestLoanTerms.id,
      amount: collateralAmountDepositCollateral,
    }
  );

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
  await loansActions.takeOutLoan(
    allContracts,
    { txConfig: borrowerTxConfig, testContext },
    {
      loanId: loanInfoRequestLoanTerms.id,
      amount: amountTakeOut,
      expectedErrorMessage: 'COLLATERAL_DEPOSITED_RECENTLY',
    }
  );

  await settingsActions.updatePlatformSettings(
    allContracts,
    { testContext, txConfig: ownerTxConfig },
    {
      settingName: platformSettingsNames.SafetyInterval,
      newValue: initialSafetyIntervalSetting.value,
    }
  );
};
