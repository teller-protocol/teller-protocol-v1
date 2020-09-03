// Util classes
const BigNumber = require('bignumber.js');
const { teller, tokens, chainlink } = require("../../scripts/utils/contracts");
const { loans, lendingPool } = require('../../test/utils/events');
const { toDecimals, toUnits, NULL_ADDRESS, ONE_DAY, minutesToSeconds, toBytes32 } = require('../../test/utils/consts');
const { createMultipleSignedLoanTermsResponses, createLoanTermsRequest } = require('../../test/utils/loan-terms-helper');
const assert = require("assert");
const platformSettingsNames = require('../../test/utils/platformSettingsNames');

module.exports = async ({accounts, getContracts, processArgs, timer, web3, nonces, chainId}) => {
  console.log('Deposit tokens as collateral.');
  const tokenName = processArgs.getValue('testTokenName');
  const collateralTokenName = 'LINK';
  const settingsInstance = await getContracts.getDeployed(teller.settings());
  const token = await getContracts.getDeployed(tokens.get(tokenName));
  const collateralToken = await getContracts.getDeployed(tokens.get(collateralTokenName));
  const lendingPoolInstance = await getContracts.getDeployed(teller.link().lendingPool(tokenName));
  const loansInstance = await getContracts.getDeployed(teller.link().loans(tokenName));
  const chainlinkOracle = await getContracts.getDeployed(chainlink.custom(collateralTokenName, tokenName));
  const loanTermConsensusInstance = await getContracts.getDeployed(teller.link().loanTermsConsensus(tokenName));

  const currentTimestamp = parseInt(await timer.getCurrentTimestamp());
  console.log(`Current timestamp: ${currentTimestamp} segs`);

  const borrower = await accounts.getAt(1);
  const recipient = NULL_ADDRESS;
  const tokenDecimals = parseInt(await token.decimals());
  const lendingPoolDepositAmountWei = toDecimals(4000, tokenDecimals);
  const amountWei = toDecimals(100, tokenDecimals);
  const maxAmountWei = toDecimals(200, tokenDecimals);
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);

  const collateralTokenDecimals = parseInt(await collateralToken.decimals());
  const initialOraclePrice = toDecimals('0.00000000026', collateralTokenDecimals); // 1 DAI = inverse(0.26 LINK)
  const finalOraclePrice = toDecimals('0.00000000030', collateralTokenDecimals); // 1 DAI = inverse(0.30 LINK)
  const initialCollateralAmount = toDecimals(165, collateralTokenDecimals);
  const borrowerTxConfig = { from: borrower };

  const senderTxConfig = await accounts.getTxConfigAt(1);
  await collateralToken.mint(senderTxConfig.from, initialCollateralAmount, senderTxConfig);

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
  const initialTotalCollateral = await loansInstance.totalCollateral();
  const initialLoansCollateralTokenBalance = await collateralToken.balanceOf(loansInstance.address);
  const initialBorrowerCollateralTokenBalance = await collateralToken.balanceOf(borrowerTxConfig.from);

  await collateralToken.approve(loansInstance.address, initialCollateralAmount, borrowerTxConfig);

  const createLoanWithTermsResult = await loansInstance.createLoanWithTerms(
    loanTermsRequest.loanTermsRequest,
    signedResponses,
    initialCollateralAmount,
    borrowerTxConfig
  );

  const termsExpiryTime = await settingsInstance.getPlatformSettingValue(toBytes32(web3, platformSettingsNames.TermsExpiryTime));
  const expiryTermsExpected = await timer.getCurrentTimestampInSecondsAndSum(termsExpiryTime);
  const loanIDs = await loansInstance.getBorrowerLoans(borrower);
  const lastLoanID = loanIDs[loanIDs.length - 1];
  loans
    .loanTermsSet(createLoanWithTermsResult)
    .emitted(
      lastLoanID,
      borrowerTxConfig.from,
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
  // Get liquidation status.
  const { escrow } = await loansInstance.loans(lastLoanID);
  loans
    .loanTakenOut(takeOutLoanResult)
    .emitted(lastLoanID, borrowerTxConfig.from, escrow, amountWei);

  // Set a lower price for Token/ETH.
  console.log(`Settings final (lower) oracle price: 1 ${tokenName} = ${finalOraclePrice.toFixed(0)} WEI = ${toUnits(finalOraclePrice, 18)} ETHER`);
  await chainlinkOracle.setLatestAnswer(finalOraclePrice);

  // Get liquidation status.
  const loanInfo = await loansInstance.loans(lastLoanID);
  
  const finalTotalCollateral = await loansInstance.totalCollateral();
  assert.equal(
    initialTotalCollateral.toString(),
    BigNumber(finalTotalCollateral.toString()).minus(loanInfo.collateral.toString()).toFixed(),
    'Invalid final total collateral balance (Loans).'
  );

  const finalLoansCollateralTokenBalance = await collateralToken.balanceOf(loansInstance.address);
  assert.equal(
    finalLoansCollateralTokenBalance.toString(),
    BigNumber(initialLoansCollateralTokenBalance.toString()).plus(initialCollateralAmount.toString()).toFixed(),
    'Invalid final collateral token balance (Loans).'
  );

  const finalBorrowerCollateralTokenBalance = await collateralToken.balanceOf(borrowerTxConfig.from);
  assert.equal(
    finalBorrowerCollateralTokenBalance.toString(),
    BigNumber(initialBorrowerCollateralTokenBalance.toString()).minus(initialCollateralAmount.toString()).toFixed(),
    'Invalid final collateral token balance (Borrower).'
  );
};
