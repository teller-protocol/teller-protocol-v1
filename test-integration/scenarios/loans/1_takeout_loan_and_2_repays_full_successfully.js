// Util classes
const {teller, tokens} = require("../../../scripts/utils/contracts");
const {
  loans: loansActions,
  oracles: oraclesActions,
  blockchain: blockchainActions,
} = require("../../utils/actions/");
const {
  toDecimals,
  NULL_ADDRESS,
} = require("../../../test/utils/consts");
const LoanInfoPrinter = require("../../../test/utils/printers/LoanInfoPrinter");

module.exports = async (testContext) => {
  const {
    processArgs,
    accounts,
    getContracts,
    timer,
    web3,
    nonces,
    chainId,
    artifacts,
  } = testContext;
  console.log("Liquidate Loan by Collateral");
  const collTokenName = "ETH";
  const tokenName = processArgs.getValue("testTokenName");
  const verbose = processArgs.getValue("verbose");

  const {
    settings: settingsInstance,
    token,
    collateralToken,
    loans: loansInstance,
    chainlinkOracle,
    pairAggregator,
    lendingPool: lendingPoolInstance,
    loanTermsConsensus: loanTermConsensusInstance,
  } = await getContracts.getAllDeployed({ teller, tokens }, tokenName, collTokenName);

  const currentTimestamp = await timer.getCurrentTimestamp();
  console.log(`Current timestamp: ${currentTimestamp} segs`);

  const borrower = await accounts.getAt(1);
  const lenderTxConfig = await accounts.getTxConfigAt(0);
  const borrowerTxConfig = await accounts.getTxConfigAt(1);
  const liquidatorTxConfig = await accounts.getTxConfigAt(2);

  const currentOraclePrice = toDecimals("0.00295835", 18); // 1 token = 0.00295835 ether = 5000000000000000 wei
  const tokenDecimals = parseInt(await token.decimals());
  const collateralTokenDecimals = parseInt(await collateralToken.decimals());
  const collateralTokenInfo = { decimals: collateralTokenDecimals, name: collTokenName};
  const tokenInfo = { decimals: tokenDecimals, name: tokenName};
  
  const depositFundsAmount = toDecimals(200, tokenDecimals);
  const maxAmountRequestLoanTerms = toDecimals(80, tokenDecimals);
  const amountTakeOut = toDecimals(50, tokenDecimals);
  const amountRepay_1 = toDecimals(25, tokenDecimals);
  const amountRepay_2 = toDecimals(55, tokenDecimals);
  const collateralAmountDepositCollateral = toDecimals(0.3, collateralTokenDecimals);
  const collateralAmountWithdrawCollateral = toDecimals(0.1, collateralTokenDecimals);
  
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);
  const collateralNeeded = "320486794520547945";
  
  const borrowerTxConfigWithValue = {
    ...borrowerTxConfig,
    value: collateralNeeded,
  };

  // Sets Initial Oracle Price
  await oraclesActions.setPrice(
    {oracle: chainlinkOracle, token},
    {txConfig: lenderTxConfig, testContext},
    {price: currentOraclePrice}
  );

  // Deposit tokens on lending pool.
  await loansActions.depositFunds(
    {token, lendingPool: lendingPoolInstance},
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
    {
      loans: loansInstance,
      loanTermsConsensus: loanTermConsensusInstance,
      settings: settingsInstance,
    },
    {txConfig: borrowerTxConfigWithValue, testContext},
    {loanTermsRequestTemplate, loanResponseTemplate}
  );

  // Depositing collateral.
  await loansActions.depositCollateral(
    {loans: loansInstance},
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: collateralAmountDepositCollateral}
  );

  await blockchainActions.advanceMinutes({timer}, {testContext}, {minutes: 2});

  // Take out a loan.
  await loansActions.takeOutLoan(
    {loans: loansInstance},
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: amountTakeOut}
  );

  await blockchainActions.advanceMinutes({timer}, {testContext}, {minutes: 5});

  // TODO Review it
  await token.mint(borrowerTxConfig.from, amountRepay_1);
  await loansActions.repay(
    {loans: loansInstance, lendingPool: lendingPoolInstance, token},
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: amountRepay_1}
  );

  await loansActions.printLoanInfo(
    { loans: loansInstance, settings: settingsInstance },
    { testContext },
    {
      loanId: loanInfoRequestLoanTerms.id,
      verbose,
      collateralTokenInfo,
      tokenInfo,
      latestAnswer: currentOraclePrice,
      oracleAddress: chainlinkOracle.address,
    }
  );

  await loansActions.withdrawCollateral(
    {loans: loansInstance},
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: collateralAmountWithdrawCollateral}
  );

  await token.mint(borrowerTxConfig.from, amountRepay_2);
  await loansActions.repay(
    {loans: loansInstance, lendingPool: lendingPoolInstance, token},
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: amountRepay_2}
  );

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
