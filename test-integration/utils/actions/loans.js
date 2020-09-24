const BigNumber = require("bignumber.js");
const platformSettingsNames = require("../../../test/utils/platformSettingsNames");
const {
  NULL_ADDRESS,
  ONE_DAY,
  toBytes32,
  toUnits,
} = require("../../../test/utils/consts");
const {
  createMultipleSignedLoanTermsResponses,
  createLoanTermsRequest,
} = require("../../../test/utils/loan-terms-helper");
const {printFullLoan} = require("../../../test/utils/printer");
const {
  lendingPool: lendingPoolEvents,
  loans: loansEvents,
} = require("../../../test/utils/events");

const depositFunds = async (
  {token, lendingPool},
  {txConfig, testContext},
  {amount}
) => {
  console.log("Depositing funds on pool...");
  await token.approve(lendingPool.address, amount, txConfig);
  const depositResult = await lendingPool.deposit(amount, txConfig);
  lendingPoolEvents
    .tokenDeposited(depositResult)
    .emitted(txConfig.from, amount);
  return depositResult;
};

const requestLoanTerms = async (
  {loans, loanTermConsensus, settings},
  {txConfig, testContext},
  {loanTermsRequestTemplate, loanResponseTemplate}
) => {
  console.log("Requesting loan terms...");
  const {web3, timer, nonces, chainId} = testContext;
  const currentTimestamp = parseInt(await timer.getCurrentTimestamp());
  const {
    amount,
    durationInDays,
    borrower,
    recipient = NULL_ADDRESS,
  } = loanTermsRequestTemplate;
  const {
    interestRate,
    collateralRatio,
    maxLoanAmount,
    signers,
    responseTime,
  } = loanResponseTemplate;

  const loanTermsRequestInfo = {
    borrower,
    recipient,
    requestNonce: nonces.newNonce(borrower),
    amount: amount.toFixed(0),
    duration: durationInDays * ONE_DAY,
    requestTime: currentTimestamp,
    caller: loans.address,
    consensusAddress: loanTermConsensus.address,
  };
  const loanResponseInfoTemplate = {
    //        responseTime: currentTimestamp - 10,
    responseTime: currentTimestamp - 10,
    interestRate,
    collateralRatio,
    maxLoanAmount: maxLoanAmount.toFixed(0),
    consensusAddress: loanTermConsensus.address,
  };
  const loanTermsRequest = createLoanTermsRequest(
    loanTermsRequestInfo,
    chainId
  );
  const signedResponses = await createMultipleSignedLoanTermsResponses(
    web3,
    loanTermsRequest,
    signers,
    loanResponseInfoTemplate,
    nonces,
    chainId
  );

  const createLoanWithTermsResult = await loans.createLoanWithTerms(
    loanTermsRequest.loanTermsRequest,
    signedResponses,
    txConfig.value,
    txConfig
  );

  const termsExpiryTime = await settings.getPlatformSettingValue(
    toBytes32(web3, platformSettingsNames.TermsExpiryTime)
  );
  const expiryTermsExpected = await timer.getCurrentTimestampInSecondsAndSum(
    termsExpiryTime
  );
  const loanIDs = await loans.getBorrowerLoans(borrower);
  const lastLoanID = loanIDs[loanIDs.length - 1];
  loansEvents
    .loanTermsSet(createLoanWithTermsResult)
    .emitted(
      lastLoanID,
      txConfig.from,
      recipient,
      loanResponseInfoTemplate.interestRate,
      loanResponseInfoTemplate.collateralRatio,
      loanResponseInfoTemplate.maxLoanAmount,
      loanTermsRequestInfo.duration,
      expiryTermsExpected
    );
  const loansInfo = await loans.loans(lastLoanID);
  return loansInfo;
};

/**
 * Deposits collateral into the Loans contract for a specific loan.
 * If the token parameter is not defined, use ETH as collateral.
 */
const depositCollateral = async (
  {loanID, token, loans},
  {txConfig, testContext},
  {amount}
) => {
  if (token) {
    await token.approve(loans.address, amount, txConfig);
  } else {
    // Don't overwrite the config object
    txConfig = Object.assign({}, txConfig);
    txConfig.value = amount;
  }
  const depositResult = await loans.depositCollateral(
    txConfig.from,
    loanID,
    amount,
    txConfig
  );
  loansEvents
    .collateralDeposited(depositResult)
    .emitted(loanID, txConfig.from, amount);
  return depositResult;
};

/**
 * Withdraws collateral from the loans contract for a specific loan.
 */
const withdrawCollateral = async (
  {loanID, loans},
  {txConfig, testContext},
  {amount}
) => {
  const depositResult = await loans.withdrawCollateral(
    loanID,
    amount,
    txConfig
  );
  loansEvents
    .collateralWithdrawn(depositResult)
    .emitted(loanID, txConfig.from, amount);
  return depositResult;
};

const takeOutLoan = async (
  {loans},
  {txConfig, testContext},
  {loanId, amount}
) => {
  console.log(`Taking out loan id ${loanId}...`);
  const takeOutLoanResult = await loans.takeOutLoan(loanId, amount, txConfig);
  const loanInfo = await loans.loans(loanId);
  const {escrow} = loanInfo;
  loansEvents
    .loanTakenOut(takeOutLoanResult)
    .emitted(loanId, txConfig.from, escrow, amount);
  return loanInfo;
};

/**
 * Repays an amount of the borrowed token for a loan.
 */
const repay = async ({loans}, {txConfig}, {loanId, amount}) => {
  const loan = await loans.loans(loanId).call();
  const totalOwed = await loans.getTotalOwed(loanId).call();
  const repayResult = await loans.repay(amount, loanId, txConfig);
  loansEvents
    .loanRepaid(repayResult)
    .emitted(loanId, loan.loanTerms.borrower, amount, txConfig.from, totalOwed);
  return repayResult;
};

const liquidateLoan = async (
  {token, loans, settings, lendingPool},
  {txConfig, testContext},
  {loanId, amount}
) => {
  console.log(`Liquidating loan id ${loanId}...`);
  const {web3} = testContext;

  const initialTotalCollateral = await loans.totalCollateral();
  const liquidateEthPrice = await settings.getPlatformSettingValue(
    toBytes32(web3, platformSettingsNames.LiquidateEthPrice)
  );
  const getCollateralInfo = await loans.getCollateralInfo(loanId);
  const {neededInLendingTokens} = getCollateralInfo;
  const transferAmountToLiquidate = BigNumber(neededInLendingTokens.toString())
    .times(liquidateEthPrice)
    .div(10000);

  // TODO Review it.
  await token.mint(txConfig.from, transferAmountToLiquidate.toFixed(0));

  const initialLiquidatorTokenBalance = await token.balanceOf(txConfig.from);

  await token.approve(
    lendingPool.address,
    transferAmountToLiquidate.toFixed(0),
    txConfig
  );
  // TODO Add validations
  const liquidateLoanResult = await loans.liquidateLoan(loanId, txConfig);
};

const printLoanInfo = async (
  {loans, settings},
  {testContext},
  {
    tokenInfo,
    collateralTokenInfo,
    loanId,
    verbose = false,
    latestAnswer,
    oracleAddress,
  }
) => {
  if (verbose === "false") {
    return;
  }
  const {web3} = testContext;
  const loanInfo = await loans.loans(loanId);
  await printFullLoan(
    web3,
    {
      tokenName: tokenInfo.name,
      tokenDecimals: tokenInfo.decimals,
      collateralTokenDecimals: collateralTokenInfo.decimals,
      collateralTokenName: collateralTokenInfo.name,
    },
    {latestAnswer, oracleAddress},
    loanInfo
  );
  const escrowInstance = await getEscrow({loans}, {testContext}, {loanId});
  const {
    valueInToken,
    valueInEth,
  } = await escrowInstance.calculateTotalValue();
  const collateralBufferBytes32 = toBytes32(web3, platformSettingsNames.CollateralBuffer);
  const collateralBufferSetting = await settings.getPlatformSetting(collateralBufferBytes32);
  const collateralBuffer = parseInt(collateralBufferSetting.value);
//Liquidable?:                   true call loans.canBeLiquidate();
  console.log('-'.repeat(120));
  console.group(`Escrow Info:`);
  console.log(`Collateral Buffer (%):           ${collateralBuffer} = ${collateralBuffer / 100} %`);
  console.log(`Escrow Address:                  ${escrowInstance.address}`);
  console.log(`Total Value (borrowed token):    ${valueInToken} = ${toUnits(valueInToken, tokenInfo.decimals).toFixed(6)} ${tokenInfo.name}`);
  console.log(`Total Value (collateral token):  ${valueInEth} = ${toUnits(valueInEth, collateralTokenInfo.decimals).toFixed(6)} ${collateralTokenInfo.name}`);
  console.groupEnd();
  console.log('-'.repeat(120));
};

const getEscrow = async (
    {loans},
    {testContext},
    {
      loanId,
    }
  ) => {
    const { artifacts } = testContext;
    const Escrow = artifacts.require("./base/Escrow.sol");
    const loanInfo = await loans.loans(loanId);
    const escrow = await Escrow.at(loanInfo.escrow);
    return escrow;
  };

module.exports = {
  depositFunds,
  requestLoanTerms,
  depositCollateral,
  withdrawCollateral,
  takeOutLoan,
  repay,
  liquidateLoan,
  printLoanInfo,
  getEscrow,
};
