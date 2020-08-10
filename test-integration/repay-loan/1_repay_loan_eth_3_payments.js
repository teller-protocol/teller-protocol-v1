// Util classes
const BigNumber = require('bignumber.js');
const { zerocollateral, tokens } = require("../../scripts/utils/contracts");
const { loans, lendingPool } = require('../../test/utils/events');
const { toDecimals, toUnits, NULL_ADDRESS, ONE_DAY, minutesToSeconds, daysToSeconds, NON_EXISTENT, toBytes32 } = require('../../test/utils/consts');
const loanStatuses = require('../../test/utils/loanStatus');
const { createMultipleSignedLoanTermsResponses, createLoanTermsRequest } = require('../../test/utils/loan-terms-helper');
const assert = require("assert");
const platformSettingsNames = require('../../test/utils/platformSettingsNames');

module.exports = async ({processArgs, accounts, getContracts, timer, web3, nonces, chainId}) => {
  console.log('Repay Loan in 3 Payments');
  const tokenName = processArgs.getValue('testTokenName');
  const settingsInstance = await getContracts.getDeployed(zerocollateral.settings());
  const token = await getContracts.getDeployed(tokens.get(tokenName));
  const lendingPoolInstance = await getContracts.getDeployed(zerocollateral.eth().lendingPool(tokenName));
  const loansInstance = await getContracts.getDeployed(zerocollateral.eth().loans(tokenName));
  const chainlinkOracle = await getContracts.getDeployed(zerocollateral.eth().chainlink.custom(tokenName));
  const loanTermConsensusInstance = await getContracts.getDeployed(zerocollateral.eth().loanTermsConsensus(tokenName));

  const currentTimestamp = parseInt(await timer.getCurrentTimestamp());
  console.log(`Current timestamp: ${currentTimestamp} segs`);

  const borrower = await accounts.getAt(1);
  const recipient = NULL_ADDRESS;
  const initialOraclePrice = toDecimals('0.005', 18); // 1 token = 0.005 ether = 5000000000000000 wei
  const decimals = parseInt(await token.decimals());
  const lendingPoolDepositAmountWei = toDecimals(4000, decimals);
  const amountWei = toDecimals(1000, decimals);
  const maxAmountWei = toDecimals(2000, decimals);
  const durationInDays = 30;
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
  loans
    .loanTakenOut(takeOutLoanResult)
    .emitted(lastLoanID, borrowerTxConfig.from, amountWei.toFixed(0));

  // Calculate payment
  console.log(`Making payment for loan id ${lastLoanID}...`);
  const initialLoanStatus = await loansInstance.loans(lastLoanID);
  const {
    principalOwed: principalOwedResult,
    interestOwed: interestOwedResult,
  } = initialLoanStatus;
  let totalOwedResult = BigNumber(principalOwedResult.toString())
                          .plus(BigNumber(interestOwedResult.toString()));
  const payment = totalOwedResult.dividedBy(3);
  // Advance time to make first payment 10 days later 
  console.log(`Advancing time to take out loan (current: ${(await timer.getCurrentDate())})...`);
  const paymentTimestamp = await timer.getCurrentTimestampInSecondsAndSum(daysToSeconds(10));
  await timer.advanceBlockAtTime(paymentTimestamp);

  // Make 1st payment
  console.log(`Repaying loan id ${lastLoanID}...`);
  console.log('Making 1st payment...');
  await token.approve(lendingPoolInstance.address, payment, {from:borrower});
  totalOwedResult = totalOwedResult.minus(payment);
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

  // Advance time to make first payment 20 days later 
  console.log(`Advancing time to take out loan (current: ${(await timer.getCurrentDate())})...`);
  const secondPaymentTimestamp = await timer.getCurrentTimestampInSecondsAndSum(daysToSeconds(10));
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

  // Advance time to make first payment 29 days later 
  console.log(`Advancing time to take out loan (current: ${(await timer.getCurrentDate())})...`);
  const thirdPaymentTimestamp = await timer.getCurrentTimestampInSecondsAndSum(daysToSeconds(9));
  await timer.advanceBlockAtTime(thirdPaymentTimestamp);

  // Make 3rd payment
  console.log('Making final payment...');
  await token.approve(lendingPoolInstance.address, payment, {from:borrower});
  const repay3_result = await loansInstance.repay(payment, lastLoanID, borrowerTxConfig);
  totalOwedResult = totalOwedResult.minus(payment);
  loans
    .loanRepaid(repay3_result)
    .emitted(lastLoanID, borrowerTxConfig.from, payment, borrowerTxConfig.from, totalOwedResult.toString());
  const loanStatus = await loansInstance.loans(lastLoanID);
  assert.equal(
    loanStatus.principalOwed,
    NON_EXISTENT,
    'Incorrect prinicpal owed.'
  );
  assert.equal(
    loanStatus.interestOwed,
    NON_EXISTENT,
    'Incorrect interest owed.'
  );
  assert.equal(
    loanStatus.status.toString(),
    loanStatuses.Closed,
    'Invalid final loan staus.'
  );
};