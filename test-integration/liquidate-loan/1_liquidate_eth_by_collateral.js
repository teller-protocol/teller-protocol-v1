// Util classes
const BigNumber = require("bignumber.js");
const {teller, tokens} = require("../../scripts/utils/contracts");
const {loans, lendingPool} = require("../../test/utils/events");
const {printFullLoan, printOraclePrice} = require("../../test/utils/printer");
const {
  loans: loansActions,
  oracles: oraclesActions,
  blockchain: blockchainActions,
} = require("../utils/actions/");
const {
  toDecimals,
  toUnits,
  NULL_ADDRESS,
  ONE_DAY,
  minutesToSeconds,
  toBytes32,
} = require("../../test/utils/consts");
const LoanInfoPrinter = require("../../test/utils/printers/LoanInfoPrinter");
const {
  createMultipleSignedLoanTermsResponses,
  createLoanTermsRequest,
} = require("../../test/utils/loan-terms-helper");
const assert = require("assert");
const platformSettingsNames = require("../../test/utils/platformSettingsNames");

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
  const collTokenDecimals = 18;
  const tokenName = processArgs.getValue("testTokenName");
  const verbose = processArgs.getValue("verbose");
  const settingsInstance = await getContracts.getDeployed(teller.settings());
  const token = await getContracts.getDeployed(tokens.get(tokenName));
  const lendingPoolInstance = await getContracts.getDeployed(
    teller.eth().lendingPool(tokenName)
  );
  const loansInstance = await getContracts.getDeployed(
    teller.eth().loans(tokenName)
  );
  const chainlinkOracle = await getContracts.getDeployed(
    teller.eth().chainlink.custom(tokenName)
  );
  const pairAggregator = await getContracts.getDeployed(
    teller.oracles().dai_eth()
  );
  const loanTermConsensusInstance = await getContracts.getDeployed(
    teller.eth().loanTermsConsensus(tokenName)
  );

  const currentTimestamp = await timer.getCurrentTimestamp();
  console.log(`Current timestamp: ${currentTimestamp} segs`);

  const borrower = await accounts.getAt(1);
  const liquidatorTxConfig = await accounts.getTxConfigAt(2);
  const recipient = NULL_ADDRESS;
  const initialOraclePrice = toDecimals("0.00295835", 18); // 1 token = 0.00295835 ether = 5000000000000000 wei
  const finalOraclePrice = toDecimals("0.00605835", 18); // 1 token = 0.006 ether = 6000000000000000 wei
  const decimals = parseInt(await token.decimals());
  const lendingPoolDepositAmountWei = toDecimals(4000, decimals);
  const amountWei = toDecimals(100, decimals);
  const maxAmountWei = toDecimals(200, decimals);
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);
  const collateralNeeded = "320486794520547945";
  const borrowerTxConfig = {from: borrower};
  const borrowerTxConfigWithValue = {
    ...borrowerTxConfig,
    value: collateralNeeded,
  };

  // Sets Initial Oracle Price

  //console.log(`Settings initial oracle price: 1 ${tokenName} = ${initialOraclePrice.toFixed(0)} WEI = ${toUnits(initialOraclePrice, 18)} ETHER`);
  //await chainlinkOracle.setLatestAnswer(initialOraclePrice);
  const lenderTxConfig = await accounts.getTxConfigAt(0);

  const loansOraclePrice = await loansInstance.priceOracle();
  console.log(`loansOraclePrice ${loansOraclePrice}`);
  console.log(`chainlinkOracle ${chainlinkOracle.address}`);
  console.log(`pairAggregator ${pairAggregator.address}`);

  await oraclesActions.setPrice(
    {oracle: chainlinkOracle, token},
    {txConfig: lenderTxConfig, testContext},
    {price: initialOraclePrice}
  );

  // Deposit tokens on lending pool.
  await loansActions.depositFunds(
    {token, lendingPool: lendingPoolInstance},
    {txConfig: lenderTxConfig},
    {amount: lendingPoolDepositAmountWei}
  );

  // Requesting the loan terms.
  const loanTermsRequestTemplate = {
    amount: amountWei,
    durationInDays,
    borrower,
  };
  const loanResponseTemplate = {
    interestRate: 4000,
    collateralRatio: 6000,
    maxLoanAmount: maxAmountWei,
    signers,
    responseTime: 50,
  };
  const loanInfoRequestLoanTerms = await loansActions.requestLoanTerms(
    {
      loans: loansInstance,
      loanTermConsensus: loanTermConsensusInstance,
      settings: settingsInstance,
    },
    {txConfig: borrowerTxConfigWithValue, testContext},
    {loanTermsRequestTemplate, loanResponseTemplate}
  );

  await blockchainActions.advanceMinutes({timer}, {testContext}, {minutes: 2});

  // Take out a loan.
  await loansActions.takeOutLoan(
    {loans: loansInstance},
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: amountWei}
  );

  // Set a lower price for Token/ETH.
  await oraclesActions.setPrice(
    {oracle: chainlinkOracle, token},
    {txConfig: lenderTxConfig, testContext},
    {price: finalOraclePrice}
  );

  await loansActions.printLoanInfo(
    { loans: loansInstance, settings: settingsInstance },
    { testContext },
    {
      loanId: loanInfoRequestLoanTerms.id,
      verbose,
      // TODO Change it
      collateralTokenInfo: { decimals: 18, name: 'ETH'},
      tokenInfo: { decimals: 18, name: tokenName},
      latestAnswer: finalOraclePrice,
      oracleAddress: loansOraclePrice,
    }
  );

  // Liquidate loan
  await loansActions.liquidateLoan(
    {
      token,
      loans: loansInstance,
      settings: settingsInstance,
      lendingPool: lendingPoolInstance,
    },
    {txConfig: liquidatorTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: amountWei}
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
