// Util classes
const BigNumber = require('bignumber.js');
const { zerocollateral, tokens } = require("../../scripts/utils/contracts");
const { loans, lendingPool } = require('../../test/utils/events');
const { toDecimals, toUnits, NULL_ADDRESS, ONE_DAY, minutesToSeconds, daysToSeconds } = require('../../test/utils/consts');
const LoanInfoPrinter = require('../../test/utils/printers/LoanInfoPrinter');
const { createMultipleSignedLoanTermsResponses, createLoanTermsRequest } = require('../../test/utils/loan-terms-helper');
const assert = require("assert");

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
  const finalOraclePrice = toDecimals('0.006', 18); // 1 token = 0.006 ether = 6000000000000000 wei
  const decimals = parseInt(await token.decimals());
  const lendingPoolDepositAmountWei = toDecimals(400, decimals);
  const amountWei = toDecimals(100, decimals);
  const maxAmountWei = toDecimals(200, decimals);
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
    .emitted(lastLoanID, borrowerTxConfig.from, amountWei);

  // Set a lower price for Token/ETH.
  console.log(`Settings final (lower) oracle price: 1 ${tokenName} = ${finalOraclePrice.toFixed(0)} WEI = ${toUnits(finalOraclePrice, 18)} ETHER`);
  await chainlinkOracle.setLatestAnswer(finalOraclePrice);

  // Calculate payment
  console.log(`Making payment for loan id ${lastLoanID}...`);
  const payment = toDecimals(34.67, decimals).toFixed(0);
  console.log('Payment....', payment);

  // Advance time to make first payment 10 days later 
  console.log(`Advancing time to take out loan (current: ${(await timer.getCurrentDate())})...`);
  const paymentTimestamp = await timer.getCurrentTimestampInSecondsAndSum(daysToSeconds(10));
  await timer.advanceBlockAtTime(paymentTimestamp);

  // Make 1st payment
  console.log(`Repaying loan id ${lastLoanID}...`);
  console.log('Making 1st payment...');
  await token.approve(loansInstance.address, payment, {from:borrower});
  await token.approve(lendingPoolInstance.address, payment, {from:borrower});
  await loansInstance.repay(payment, lastLoanID, borrowerTxConfig);

  // Advance time to make first payment 20 days later 
  console.log(`Advancing time to take out loan (current: ${(await timer.getCurrentDate())})...`);
  const secondPaymentTimestamp = await timer.getCurrentTimestampInSecondsAndSum(daysToSeconds(10));
  await timer.advanceBlockAtTime(secondPaymentTimestamp);

  // Make 2nd payment
  console.log('Making 2nd payment...');
  await token.approve(loansInstance.address, payment, {from:borrower});
  await token.approve(lendingPoolInstance.address, payment, {from:borrower});
  await loansInstance.repay(payment, lastLoanID, borrowerTxConfig);

  // Advance time to make first payment 29 days later 
  console.log(`Advancing time to take out loan (current: ${(await timer.getCurrentDate())})...`);
  const thirdPaymentTimestamp = await timer.getCurrentTimestampInSecondsAndSum(daysToSeconds(9));
  await timer.advanceBlockAtTime(thirdPaymentTimestamp);

  // Make 3rd payment
  console.log('Making 3rd payment...');
  await token.approve(loansInstance.address, payment, {from:borrower});
  await token.approve(lendingPoolInstance.address, payment, {from:borrower});
  const finalPaymentResult = await loansInstance.repay(payment, lastLoanID, borrowerTxConfig);

  // Check final loan status 
  const loanStatus = await loansInstance.loans(lastLoanID);
  const finalLoanStatus = loanStatus.status;
  console.log('Status.....', finalLoanStatus.toString());

  const loanInfo = await loansInstance.loans(lastLoanID);
  const loanPrinter = new LoanInfoPrinter(web3, loanInfo, { tokenName, decimals });
  const getTotalOwed = loanPrinter.getTotalOwed();

  // I've tried adding the loanRepaid in the events.js. However the finalPaymentResult returned from the loansInstance.repay returns two events. 
//   loans
//     .loanRepaid(finalPaymentResult)
//     .emitted(lastLoanID, borrower, payment, borrower, getTotalOwed);

  assert.equal(
      finalLoanStatus.toString(),
      BigNumber((3).toString()),
      'Invalid final loan staus.'
  );
};