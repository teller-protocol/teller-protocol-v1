// Util classes
const {teller, tokens} = require("../../../scripts/utils/contracts");
const {
  loans: loansActions,
  oracles: oraclesActions,
  blockchain: blockchainActions,
} = require("../../utils/actions");
const {
  loans: loansAssertions,
} = require("../../utils/assertions");
const {
  toDecimals,
} = require("../../../test/utils/consts");
const loanStatus = require("../../../test/utils/loanStatus");

module.exports = async (testContext) => {
  const {
    processArgs,
    accounts,
    getContracts,
    timer,
  } = testContext;
  console.log("Scenario: Take out a loan and repay twice in full successfully.");
  const collTokenName = "ETH";
  const tokenName = processArgs.getValue("testTokenName");
  const verbose = processArgs.getValue("verbose");

  const allContracts = await getContracts.getAllDeployed({ teller, tokens }, tokenName, collTokenName);
  const {
    token,
    collateralToken,
    oracle,
    loans:loansInstance,
  } = allContracts;

  const borrower = await accounts.getAt(1);
  const lenderTxConfig = await accounts.getTxConfigAt(0);
  const borrowerTxConfig = await accounts.getTxConfigAt(1);

  const currentOraclePrice = toDecimals("0.00295835", 18); // 1 token = 0.00295835 ether = 5000000000000000 wei
  const tokenDecimals = parseInt(await token.decimals());
  const collateralTokenDecimals = parseInt(await collateralToken.decimals());
  const collateralTokenInfo = { decimals: collateralTokenDecimals, name: collTokenName};
  const tokenInfo = { decimals: tokenDecimals, name: tokenName};
  
  const depositFundsAmount = toDecimals(200, tokenDecimals);
  const maxAmountRequestLoanTerms = toDecimals(80, tokenDecimals);
  const amountTakeOut = toDecimals(50, tokenDecimals);
  const amountRepay_1 = toDecimals(25, tokenDecimals);
  const amountRepay_2 = toDecimals(30, tokenDecimals);
  const collateralAmountDepositCollateral = toDecimals(0.3, collateralTokenDecimals);
  const collateralAmountWithdrawCollateral = toDecimals(0.1, collateralTokenDecimals);
  
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);

  // Sets Initial Oracle Price
  await oraclesActions.setPrice(
    allContracts,
    {txConfig: lenderTxConfig, testContext},
    {price: currentOraclePrice}
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
    borrower,
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
    {loanTermsRequestTemplate, loanResponseTemplate}
  );

  // Depositing collateral.
  await loansActions.depositCollateral(
    {...allContracts, token: undefined},
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: collateralAmountDepositCollateral}
  );

  await blockchainActions.advanceMinutes({timer}, {testContext}, {minutes: 2});

  // Take out a loan.
  await loansActions.takeOutLoan(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: amountTakeOut}
  );

  await blockchainActions.advanceMinutes({timer}, {testContext}, {minutes: 5});

  // TODO Review it
  await token.mint(borrowerTxConfig.from, amountRepay_1);
  await loansActions.repay(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: amountRepay_1}
  );

  await loansActions.withdrawCollateral(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: collateralAmountWithdrawCollateral}
  );

  await token.mint(borrowerTxConfig.from, amountRepay_2);
  await loansActions.repay(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: amountRepay_2}
  );

  await loansActions.printLoanInfo(
    allContracts,
    { testContext },
    {
      loanId: loanInfoRequestLoanTerms.id,
      verbose,
      collateralTokenInfo,
      tokenInfo,
      latestAnswer: currentOraclePrice,
      oracleAddress: oracle.address,
    }
  );

  await loansAssertions.assertClosedLoan(
    allContracts,
    { testContext },
    {
      id: loanInfoRequestLoanTerms.id,
      status: loanStatus.Closed,
    }
  );
/*
  const loanInfo = await loansInstance.loans(loanInfoRequestLoanTerms.id);
  console.log(loanInfo);
  assert.equal(loanInfo.id.toString(), loanInfoRequestLoanTerms.id.toString());
  assert.equal(loanInfo.status.toString(), loanStatus.Closed.toString());
  assert.equal(loanInfo.collateral.toString(), '0');
  assert.equal(loanInfo.principalOwed.toString(), '0');
  assert.equal(loanInfo.interestOwed.toString(), '0');
  assert.equal(loanInfo.liquidated, false);
  */
  /*
  console.log(`Liquidating loan id ${lastLoanID}...`);

  const initialTotalCollateral = await loansInstance.totalCollateral();
  const liquidateEthPrice = await settingsInstance.getPlatformSettingValue(toBytes32(web3, platformSettingsNames.LiquidateEthPrice));
  const getCollateralInfo = await loansInstance.getCollateralInfo(lastLoanID);
  const {
    neededInLendingTokens,
  } = getCollateralInfo;
  const transferAmountToLiquidate = BigNumber(neededInLendingTokens.toString()).times(liquidateEthPrice).div(10000);

  await token.mint(liquidatorTxConfig.from, transferAmountToLiquidate.toFixed(0));

  const initialLiquidatorTokenBalance = await token.balanceOf(liquidatorTxConfig.from);

  await token.approve(lendingPoolInstance.address, transferAmountToLiquidate.toFixed(0), liquidatorTxConfig);
  const liquidateLoanResult = await loansInstance.liquidateLoan(lastLoanID, liquidatorTxConfig);

  const loanPrinter = new LoanInfoPrinter(
    web3,
    loanInfo,
    { tokenName, decimals },
    {
      tokenName: collTokenName,
      decimals: collTokenDecimals
    }
  );
  const tokensPaymentIn = loanPrinter.getTotalTokensPaymentInLiquidation(finalOraclePrice, liquidateEthPrice);
  loans
    .loanLiquidated(liquidateLoanResult)
    .emitted(lastLoanID, borrower, liquidatorTxConfig.from, loanInfo.collateral, tokensPaymentIn);

  const finalTotalCollateral = await loansInstance.totalCollateral();
  assert.equal(
    loanInfo.collateral.toString(),
    BigNumber(initialTotalCollateral.toString()).minus(finalTotalCollateral.toString()).toFixed(0),
    'Invalid final total collateral balance (Loans).'
  );

  const finalLiquidatorTokenBalance = await token.balanceOf(liquidatorTxConfig.from);
  assert.equal(
    tokensPaymentIn.toFixed(0),
    BigNumber(initialLiquidatorTokenBalance.toString()).minus(finalLiquidatorTokenBalance.toString()).toFixed(0),
    'Invalid final liquidator lending tokens balance.'
  );
  */
};
