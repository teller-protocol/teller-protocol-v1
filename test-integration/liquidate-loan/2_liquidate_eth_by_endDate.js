// Util classes
const assert = require('assert');
const BigNumber = require('bignumber.js');
const { zerocollateral, tokens, chainlink } = require("../../scripts/utils/contracts");
const { loans, lendingPool } = require('../../test/utils/events');
const { toDecimals, toUnits, NULL_ADDRESS, ONE_DAY, minutesToSeconds, DEFAULT_DECIMALS, toBytes32 } = require('../../test/utils/consts');
const LoanInfoPrinter = require('../../test/utils/printers/LoanInfoPrinter');
const { createMultipleSignedLoanTermsResponses, createLoanTermsRequest } = require('../../test/utils/loan-terms-helper');
const platformSettingsNames = require('../../test/utils/platformSettingsNames');

module.exports = async ({processArgs, accounts, getContracts, timer, web3, nonces, chainId}) => {
  console.log('Liquidate Loan by End Time');
  const tokenName = processArgs.getValue('testTokenName');
  const settingsInstance = await getContracts.getDeployed(zerocollateral.settings());
  const token = await getContracts.getDeployed(tokens.get(tokenName));
  const lendingPoolInstance = await getContracts.getDeployed(zerocollateral.eth().lendingPool(tokenName));
  const loansInstance = await getContracts.getDeployed(zerocollateral.eth().loans(tokenName));
  const chainlinkOracle = await getContracts.getDeployed(zerocollateral.eth().chainlink.custom(tokenName));
  const loanTermConsensusInstance = await getContracts.getDeployed(zerocollateral.eth().loanTermsConsensus(tokenName));
  
  const currentTimestamp = await timer.getCurrentTimestamp();
  const borrower = await accounts.getAt(1);
  const liquidatorTxConfig = await accounts.getTxConfigAt(2);
  const recipient = NULL_ADDRESS;
  const borrowerNonce = nonces.newNonce(borrower);
  const oraclePrice = toDecimals('0.005', DEFAULT_DECIMALS); // 1 token = 0.005 ether = 5000000000000000 wei
  const decimals = parseInt(await token.decimals());
  const lendingPoolDepositAmountWei = toDecimals(1000, DEFAULT_DECIMALS);
  const amountWei = toDecimals(100, DEFAULT_DECIMALS);
  const maxAmountWei = toDecimals(200, DEFAULT_DECIMALS);
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);
  const collateralNeeded = toDecimals(0.321, DEFAULT_DECIMALS);
  const borrowerTxConfig = { from: borrower };
  const borrowerTxConfigWithValue = { ...borrowerTxConfig, value: collateralNeeded };

  // Sets Initial Oracle Price
  console.log(`Settings initial oracle price: 1 ${tokenName} = ${oraclePrice.toFixed(0)} WEI = ${toUnits(oraclePrice, 18)} ETHER`);
  await chainlinkOracle.setLatestAnswer(oraclePrice);

  // Deposit tokens on lending pool.
  console.log('Depositing tokens on lending pool...');
  const lenderTxConfig = await accounts.getTxConfigAt(0);
  await token.approve(lendingPoolInstance.address, lendingPoolDepositAmountWei, lenderTxConfig);
  const depositResult = await lendingPoolInstance.deposit(lendingPoolDepositAmountWei, lenderTxConfig);
  lendingPool
    .tokenDeposited(depositResult)
    .emitted(lenderTxConfig.from, lendingPoolDepositAmountWei);

  // Set loan terms.
  console.log('Requesting loan terms and signing responses...');
  const loanTermsRequestInfo = {
    borrower,
    recipient,
    requestNonce: borrowerNonce,
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
  console.log(`Setting loan terms (${signedResponses.length} signed responses)...`);
  await loansInstance.createLoanWithTerms(
    loanTermsRequest.loanTermsRequest,
    signedResponses,
    borrowerTxConfigWithValue.value,
    borrowerTxConfigWithValue
  );

  const loanIDs = await loansInstance.getBorrowerLoans(borrower);
  const lastLoanID = loanIDs[loanIDs.length - 1];

  const nextTimestamp_1 = await timer.getCurrentTimestampInSecondsAndSum(minutesToSeconds(2));
  console.log(`Advancing time to take out loan (Current: ${(await timer.getCurrentDate())})...`);
  await timer.advanceBlockAtTime(nextTimestamp_1);
  
  // Take out a loan.
  console.log(`Taking out loan id ${lastLoanID}...`);
  await loansInstance.takeOutLoan(lastLoanID, amountWei, borrowerTxConfig);

  // Advance time.
  const nextTimestamp_2 = await timer.getCurrentTimestampInSecondsAndSum(loanTermsRequestInfo.duration + 1);
  console.log(`Advancing time to liquidate loan (Current: ${(await timer.getCurrentDate())})...`);
  await timer.advanceBlockAtTime(nextTimestamp_2);

  // Get liquidation status.
  const loanInfo = await loansInstance.loans(lastLoanID);

  console.log(`Liquidating loan id ${lastLoanID}...`);

  const initialTotalCollateral = await loansInstance.totalCollateral();
  const liquidateEthPrice = await settingsInstance.getPlatformSettingValue(toBytes32(web3, platformSettingsNames.LiquidateEthPrice));
  const {
    collateralNeededLendingTokens,
  } = await loansInstance.getCollateralInfo(lastLoanID);
  const transferAmountToLiquidate = BigNumber(collateralNeededLendingTokens.toString());

  await token.mint(liquidatorTxConfig.from, transferAmountToLiquidate.toFixed(0));

  const initialLiquidatorTokenBalance = await token.balanceOf(liquidatorTxConfig.from);

  await token.approve(lendingPoolInstance.address, transferAmountToLiquidate.toFixed(0), liquidatorTxConfig);
  const liquidateLoanResult = await loansInstance.liquidateLoan(lastLoanID, liquidatorTxConfig);

  const loanPrinter = new LoanInfoPrinter(web3, loanInfo, { tokenName, decimals });
  const tokensPaymentIn = loanPrinter.getTotalTokensPaymentInLiquidation(oraclePrice, liquidateEthPrice);
  loans
    .loanLiquidated(liquidateLoanResult)
    .emitted(lastLoanID, borrower, liquidatorTxConfig.from, loanInfo.collateral, tokensPaymentIn);

  const finalTotalCollateral = await loansInstance.totalCollateral();
  assert.equal(
    finalTotalCollateral.toString(),
    BigNumber(initialTotalCollateral.toString()).minus(loanInfo.collateral.toString()).toFixed(),
    'Invalid final total collateral balance (Loans).'
  );

  const finalLiquidatorTokenBalance = await token.balanceOf(liquidatorTxConfig.from);
  assert.equal(
    tokensPaymentIn.toString(),
    BigNumber(initialLiquidatorTokenBalance.toString()).minus(finalLiquidatorTokenBalance.toString()).toFixed(),
    'Invalid final liquidator tokens balance.'
  );
};
