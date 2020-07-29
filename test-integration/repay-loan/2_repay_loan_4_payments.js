// Util classes
const BigNumber = require('bignumber.js');
const { zerocollateral, tokens, chainlink } = require("../../scripts/utils/contracts");
const { loans, lendingPool } = require('../../test/utils/events');
const { toDecimals, toUnits, NULL_ADDRESS, ONE_DAY, minutesToSeconds, daysToSeconds } = require('../../test/utils/consts');
const loanStatuses = require('../../test/utils/loanStatus');
const { createMultipleSignedLoanTermsResponses, createLoanTermsRequest } = require('../../test/utils/loan-terms-helper');
const assert = require("assert");

module.exports = async ({processArgs, accounts, getContracts, timer, web3, nonces, chainId}) => {
  console.log('Repay Loan in 4 Payments');
  const tokenName = processArgs.getValue('testTokenName');
  const oracleTokenName = 'USD';
  const collateralTokenName = 'LINK';
  const settingsInstance = await getContracts.getDeployed(zerocollateral.settings());
  const token = await getContracts.getDeployed(tokens.get(tokenName));
  const collateralToken = await getContracts.getDeployed(tokens.get(collateralTokenName));
  const lendingPoolInstance = await getContracts.getDeployed(zerocollateral.link().lendingPool(tokenName));
  const loansInstance = await getContracts.getDeployed(zerocollateral.link().loans(tokenName));
  const chainlinkOracle = await getContracts.getDeployed(chainlink.custom(collateralTokenName, oracleTokenName));
  const loanTermConsensusInstance = await getContracts.getDeployed(zerocollateral.link().loanTermsConsensus(tokenName));

  const currentTimestamp = parseInt(await timer.getCurrentTimestamp());
  console.log(`Current timestamp: ${currentTimestamp} segs`);

  const borrower = await accounts.getAt(1);
  const recipient = NULL_ADDRESS;
  const initialOraclePrice = toDecimals('0.005', 18); // 1 token = 0.005 ether = 5000000000000000 wei
  const decimals = parseInt(await token.decimals());
  const lendingPoolDepositAmountWei = toDecimals(4000, decimals);
  const amountWei = toDecimals(800, decimals);
  const maxAmountWei = toDecimals(2000, decimals);
  const durationInDays = 60;
  const signers = await accounts.getAllAt(12, 13);
  const senderTxConfig = await accounts.getTxConfigAt(1);
  const collateralTokenDecimals = parseInt(await collateralToken.decimals());
  const initialCollateralAmount = toDecimals(10000, collateralTokenDecimals);
  const finalCollateralAmount = toDecimals(100, collateralTokenDecimals);
  await collateralToken.mint(senderTxConfig.from, initialCollateralAmount, senderTxConfig);
  await collateralToken.mint(senderTxConfig.from, finalCollateralAmount, senderTxConfig)
  const collateralNeeded = '320486794520547945';
  
  const borrowerTxConfig = { from: borrower };
  const borrowerTxConfigWithValue = { ...borrowerTxConfig, value: collateralNeeded };

  // Sets Initial Oracle Price
  console.log(`Settings initial oracle price: 1 ${tokenName} = ${initialOraclePrice.toFixed(0)} = ${toUnits(initialOraclePrice, collateralTokenDecimals)} ${collateralTokenName}`);
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
    interestRate: 400,
    collateralRatio: 600,
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

  await collateralToken.approve(loansInstance.address, initialCollateralAmount, borrowerTxConfig);

  const createLoanWithTermsResult = await loansInstance.createLoanWithTerms(
    loanTermsRequest.loanTermsRequest,
    signedResponses,
    initialCollateralAmount,
    borrowerTxConfig
  );

  const termsExpiryTime = await settingsInstance.termsExpiryTime();
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
  loans
    .loanTakenOut(takeOutLoanResult)
    .emitted(lastLoanID, borrowerTxConfig.from, amountWei.toFixed(0));

  // Calculate payment
  console.log(`Making payment for loan id ${lastLoanID}...`);
  const payment = toDecimals(212, decimals).toFixed(0);
  console.log('Payment....', payment);

  // Advance time to make first payment 15 days later 
  console.log(`Advancing time to take out loan (current: ${(await timer.getCurrentDate())})...`);
  const paymentTimestamp = await timer.getCurrentTimestampInSecondsAndSum(daysToSeconds(15));
  await timer.advanceBlockAtTime(paymentTimestamp);
  const initialLoanStatus = await loansInstance.loans(lastLoanID);
  const {
    principalOwed: principalOwedResult,
    interestOwed: interestOwedResult,
  } = initialLoanStatus;
  let totalOwedResult = BigNumber(principalOwedResult.toString())
                          .plus(BigNumber(interestOwedResult.toString()));

  totalOwedResult = totalOwedResult.minus(payment);

  // Make 1st payment
  console.log(`Repaying loan id ${lastLoanID}...`);
  console.log('Making 1st payment...');
  await token.approve(lendingPoolInstance.address, payment, {from:borrower});
  const repay1_result = await loansInstance.repay(payment, lastLoanID, borrowerTxConfig);
  loans
    .loanRepaid(repay1_result)
    .emitted(lastLoanID, borrowerTxConfig.from, payment, borrowerTxConfig.from, totalOwedResult.toString());

  // Check loan status
  const firstLoanStatus = await loansInstance.loans(lastLoanID);
  const firstLoanStatusResult = firstLoanStatus.status;
  assert.equal(
    firstLoanStatusResult.toString(),
    BigNumber((2).toString()),
    'Invalid final loan staus.'
  );

  // Advance time to make first payment 30 days later 
  console.log(`Advancing time to take out loan (current: ${(await timer.getCurrentDate())})...`);
  const secondPaymentTimestamp = await timer.getCurrentTimestampInSecondsAndSum(daysToSeconds(15));
  await timer.advanceBlockAtTime(secondPaymentTimestamp);

  // Make 2nd payment
  console.log('Making 2nd payment...');
  await token.approve(lendingPoolInstance.address, payment, {from:borrower});
  totalOwedResult = totalOwedResult.minus(payment);
  const repay2_result = await loansInstance.repay(payment, lastLoanID, borrowerTxConfig);
  // Check loan status
  loans
    .loanRepaid(repay2_result)
    .emitted(lastLoanID, borrowerTxConfig.from, payment, borrowerTxConfig.from, totalOwedResult.toString());
  const secondLoanStatus = await loansInstance.loans(lastLoanID) 
  assert.equal(
    secondLoanStatus.status.toString(),
    loanStatuses.Active,
    'Invalid #2 loan staus.'
  );

  // Advance time to make first payment 45 days later 
  console.log(`Advancing time to take out loan (current: ${(await timer.getCurrentDate())})...`);
  const thirdPaymentTimestamp = await timer.getCurrentTimestampInSecondsAndSum(daysToSeconds(15));
  await timer.advanceBlockAtTime(thirdPaymentTimestamp);

  // Make 3rd payment
  console.log('Making 3rd payment...');
  await token.approve(lendingPoolInstance.address, payment, {from:borrower});
  const repay3_result = await loansInstance.repay(payment, lastLoanID, borrowerTxConfig);
  // Check loan status
  totalOwedResult = totalOwedResult.minus(payment);
  loans
    .loanRepaid(repay3_result)
    .emitted(lastLoanID, borrowerTxConfig.from, payment, borrowerTxConfig.from, totalOwedResult.toString());
  const thirdLoanStatus = await loansInstance.loans(lastLoanID) 
  assert.equal(
    thirdLoanStatus.status.toString(),
    loanStatuses.Active,
    'Invalid #3 loan staus.'
  );

  // Advance time to make first payment 55 days later 
  console.log(`Advancing time to take out loan (current: ${(await timer.getCurrentDate())})...`);
  const forthPaymentTimestamp = await timer.getCurrentTimestampInSecondsAndSum(daysToSeconds(10));
  await timer.advanceBlockAtTime(forthPaymentTimestamp);

  // Make 4th payment
  console.log('Making final payment...');
  await token.approve(lendingPoolInstance.address, payment, {from:borrower});
  const repay4_result = await loansInstance.repay(payment, lastLoanID, borrowerTxConfig);

  // Check final loan status 
  totalOwedResult = totalOwedResult.minus(payment);
  console.log('Expected (after 4# repay) total owed:  ', totalOwedResult.toString());
  loans
    .loanRepaid(repay4_result)
    .emitted(lastLoanID, borrowerTxConfig.from, payment, borrowerTxConfig.from, totalOwedResult.toString());
  const loanStatus = await loansInstance.loans(lastLoanID);
  assert.equal(
    loanStatus.status.toString(),
    loanStatuses.Closed,
    'Invalid final loan staus.'
  );
};