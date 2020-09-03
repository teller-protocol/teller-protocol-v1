// Util classes
const BigNumber = require('bignumber.js');
const { teller, tokens } = require("../../scripts/utils/contracts");
const { loans, lendingPool } = require('../../test/utils/events');
const { toDecimals, toUnits, NULL_ADDRESS, ONE_DAY, minutesToSeconds, toBytes32 } = require('../../test/utils/consts');
const LoanInfoPrinter = require('../../test/utils/printers/LoanInfoPrinter');
const { createMultipleSignedLoanTermsResponses, createLoanTermsRequest } = require('../../test/utils/loan-terms-helper');
const assert = require("assert");
const platformSettingsNames = require('../../test/utils/platformSettingsNames');

module.exports = async ({processArgs, accounts, getContracts, timer, web3, nonces, chainId}) => {
  console.log('Liquidate Loan by Collateral');
  const tokenName = processArgs.getValue('testTokenName');
  const settingsInstance = await getContracts.getDeployed(teller.settings());
  const token = await getContracts.getDeployed(tokens.get(tokenName));
  const lendingPoolInstance = await getContracts.getDeployed(teller.eth().lendingPool(tokenName));
  const loansInstance = await getContracts.getDeployed(teller.eth().loans(tokenName));
  const chainlinkOracle = await getContracts.getDeployed(teller.eth().chainlink.custom(tokenName));
  const loanTermConsensusInstance = await getContracts.getDeployed(teller.eth().loanTermsConsensus(tokenName));

  const currentTimestamp = parseInt(await timer.getCurrentTimestamp());
  console.log(`Current timestamp: ${currentTimestamp} segs`);

  const borrower = await accounts.getAt(1);
  const liquidatorTxConfig = await accounts.getTxConfigAt(2);
  const recipient = NULL_ADDRESS;
  const initialOraclePrice = toDecimals('0.005', 18); // 1 token = 0.005 ether = 5000000000000000 wei
  const finalOraclePrice = toDecimals('0.09', 18); // 1 token = 0.006 ether = 6000000000000000 wei
  const decimals = parseInt(await token.decimals());
  const lendingPoolDepositAmountWei = toDecimals(4000, decimals);
  const amountWei = toDecimals(100, decimals);
  const maxAmountWei = toDecimals(200, decimals);
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);
  const collateralNeeded = '320486794520547945';
  const borrowerTxConfig = { from: borrower };
  const borrowerTxConfigWithValue = { ...borrowerTxConfig, value: collateralNeeded };

  // Sets Initial Oracle Price
  console.log(`Settings initial oracle price: 1 ${tokenName} = ${initialOraclePrice.toFixed(0)} WEI = ${toUnits(initialOraclePrice, 18)} ETHER`);
  await chainlinkOracle.setLatestAnswer(initialOraclePrice);

  // Deposit tokens on lending pool.
  console.log('Depositing tokens on lending pool...');
  const lenderTxConfig = await accounts.getTxConfigAt(0);
  await token.approve(lendingPoolInstance.address, lendingPoolDepositAmountWei, lenderTxConfig);
  const depositResult = await lendingPoolInstance.deposit(lendingPoolDepositAmountWei, lenderTxConfig);
  lendingPool
    .tokenDeposited(depositResult)
    .emitted(lenderTxConfig.from, lendingPoolDepositAmountWei);

  // Set loan terms.
  console.log('Setting loan terms...');
  const loanTermsRequestInfo = {
    borrower,
    recipient,
    requestNonce: nonces.newNonce(borrower),
    amount: amountWei.toFixed(0),
    duration: durationInDays * ONE_DAY,
    requestTime: currentTimestamp,
    caller: loansInstance.address,
    consensusAddress: loanTermConsensusInstance.address,
  };
  const loanResponseInfoTemplate = {
    responseTime: currentTimestamp - 10,
    interestRate: 4000,
    collateralRatio: 6000,
    maxLoanAmount: maxAmountWei.toFixed(0),
    consensusAddress: loanTermConsensusInstance.address,
  };
  const loanTermsRequest = createLoanTermsRequest(loanTermsRequestInfo, chainId);
  const signedResponses = await createMultipleSignedLoanTermsResponses(
    web3,
    loanTermsRequest,
    signers,
    loanResponseInfoTemplate,
    nonces,
    chainId,
  );

  const createLoanWithTermsResult = await loansInstance.createLoanWithTerms(
    loanTermsRequest.loanTermsRequest,
    signedResponses,
    borrowerTxConfigWithValue.value,
    borrowerTxConfigWithValue
  );

  const termsExpiryTime = await settingsInstance.getPlatformSettingValue(toBytes32(web3, platformSettingsNames.TermsExpiryTime));
  const expiryTermsExpected = await timer.getCurrentTimestampInSecondsAndSum(termsExpiryTime);
  const loanIDs = await loansInstance.getBorrowerLoans(borrower);
  const lastLoanID = loanIDs[loanIDs.length - 1];
  loans
    .loanTermsSet(createLoanWithTermsResult)
    .emitted(
      lastLoanID,
      borrowerTxConfigWithValue.from,
      recipient,
      loanResponseInfoTemplate.interestRate,
      loanResponseInfoTemplate.collateralRatio,
      loanResponseInfoTemplate.maxLoanAmount,
      loanTermsRequestInfo.duration,
      expiryTermsExpected,
    );

  console.log(`Advancing time to take out loan (current: ${(await timer.getCurrentDate())})...`);
  const nextTimestamp = await timer.getCurrentTimestampInSecondsAndSum(minutesToSeconds(2));
  await timer.advanceBlockAtTime(nextTimestamp);
  
  // Take out a loan.
  console.log(`Taking out loan id ${lastLoanID}...`);
  const takeOutLoanResult = await loansInstance.takeOutLoan(lastLoanID, amountWei, borrowerTxConfig);
  const { escrow } = await loansInstance.loans(lastLoanID);
  loans
    .loanTakenOut(takeOutLoanResult)
    .emitted(lastLoanID, borrowerTxConfig.from, escrow, amountWei);

  // Set a lower price for Token/ETH.
  console.log(`Settings final (lower) oracle price: 1 ${tokenName} = ${finalOraclePrice.toFixed(0)} WEI = ${toUnits(finalOraclePrice, 18)} ETHER`);
  await chainlinkOracle.setLatestAnswer(finalOraclePrice);

  // Get liquidation status.
  const loanInfo = await loansInstance.loans(lastLoanID);
  
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

  const loanPrinter = new LoanInfoPrinter(web3, loanInfo, { tokenName, decimals });
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
};
