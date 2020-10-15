const BigNumber = require('bignumber.js');
const loanStatus = require("./loanStatus");
const platformSettingsNames = require("./platformSettingsNames");
const { secondsToDays, toUnits, NULL_ADDRESS, toBytes32 } = require("./consts");

const LINE_SEPARATOR_LENGTH = 180;
const SIMPLE_SEPARATOR = '-'.repeat(LINE_SEPARATOR_LENGTH);
const SEPARATOR = '='.repeat(LINE_SEPARATOR_LENGTH);
const YEAR = 365;
const INFO_DECIMALS = 6;

const printInterestRate = ({ loanInfo }, { tokenInfo }) => {
    const loanTerms = loanInfo.loanTerms;
    const tokenName = tokenInfo.symbol;
    const tokenDecimals = tokenInfo.decimals;

    const amount = loanInfo.status === loanStatus.Active ? loanInfo.borrowedAmount : loanTerms.maxLoanAmount;
    const amountWithUnits = toUnits(amount, tokenDecimals);

    console.log(SIMPLE_SEPARATOR);
    console.group(`Interest Rate Info:`);
    const durationInDays = secondsToDays(loanTerms.duration);

    console.log(`Amount:                ${amountWithUnits.toFixed(4)} ${tokenName}`);
    console.log(`Duration:              ${durationInDays} days = ${loanTerms.duration} secs`);
    
    console.log(`APR:                   ${loanTerms.interestRate} == ${BigNumber(loanTerms.interestRate).div(100)} % = ${BigNumber(loanTerms.interestRate).div(10000)}`);
    const interestRatePerYear = BigNumber(loanTerms.interestRate).div(10000);
    const interestPerYear = amountWithUnits.times(interestRatePerYear);
    console.log(`Yearly (% / ${tokenName}):     ${interestRatePerYear.times(100).toFixed(8)} % / ${interestPerYear.toFixed(8)} ${tokenName}`);

    const interestRatePerMonth = interestRatePerYear.div(12);
    const interestPerMonth = interestPerYear.div(12);
    console.log(`Monthly (% / ${tokenName}):    ${interestRatePerMonth.times(100).toFixed(8)} % / ${interestPerMonth.toFixed(8)} ${tokenName}`);

    const interestRatePerDay = interestRatePerYear.div(YEAR);
    const interestPerDay = interestPerYear.div(YEAR);
    console.log(`Daily (% / ${tokenName}):      ${interestRatePerDay.toFixed(8)} % / ${interestPerDay.toFixed(8)} ${tokenName}`);

    const interestPerDuration = interestPerYear.times(durationInDays).div(YEAR);
    const interestRatePerDuration  = interestRatePerDay.times(durationInDays);
    console.log(`Duration (% / ${tokenName}):   ${interestRatePerDuration.toFixed(8)} % / ${interestPerDuration.toFixed(8)} ${tokenName}`);
    console.groupEnd();
    console.log(SIMPLE_SEPARATOR);
}

const printLoanTerms = ({loanTerms}, { tokenInfo}) => {
    console.log(SIMPLE_SEPARATOR);
    console.group('Loan Terms:')
    console.log(`Borrower:          ${loanTerms.borrower}`);
    console.log(`Recipient:         ${loanTerms.recipient}`);
    const durationInDays = secondsToDays(loanTerms.duration);
    console.log(`Duration:          ${loanTerms.duration} sec = ${durationInDays} days`);
    console.log(`Collateral Ratio:  ${loanTerms.collateralRatio} == ${BigNumber(loanTerms.collateralRatio).div(100)} % = ${BigNumber(loanTerms.collateralRatio).div(10000)}`);
    
    const maxLoanAmountUnits = toUnits(loanTerms.maxLoanAmount, tokenInfo.decimals);
    console.log(`Max. Loan Amount:  ${loanTerms.maxLoanAmount} = ${maxLoanAmountUnits} ${tokenInfo.symbol}`);
    console.groupEnd();
    console.log(SIMPLE_SEPARATOR);
}

const printEscrow = async ({ settings }, {testContext}, {tokenInfo, collateralTokenInfo, escrow}) => {
    const { web3 } = testContext;
    console.log(SIMPLE_SEPARATOR);
    console.group('Escrow Info:')
    if(escrow === undefined) {
        console.log('Escrow not defined.');
        console.groupEnd();
        console.log(SIMPLE_SEPARATOR);
        return;
    }

    // const {
    //     valueInToken,
    //     valueInEth,
    // } = await escrow.calculateTotalValue();
    // const collateralBufferBytes32 = toBytes32(web3, platformSettingsNames.CollateralBuffer);
    // const collateralBufferSetting = await settings.getPlatformSetting(collateralBufferBytes32);
    // const collateralBuffer = parseInt(collateralBufferSetting.value);

    // console.log(`Collateral Buffer (%):             ${collateralBuffer} = ${collateralBuffer / 100} %`);
    console.log(`Escrow Address:                    ${escrow.address}`);
    // console.log(`Total Value (borrowed token):      ${valueInToken} = ${toUnits(valueInToken, tokenInfo.decimals).toFixed(6)} ${tokenInfo.symbol}`);
    // console.log(`Total Value (ETH):                 ${valueInEth} = ${toUnits(valueInEth, 18).toFixed(6)} ETH`);
    console.groupEnd();
    console.log(SIMPLE_SEPARATOR);
}

const printTokensInfo = async ({ tokenInfo, collateralTokenInfo }) => {
    console.log(SIMPLE_SEPARATOR);
    console.group(`Market Info:`);
    console.group(`Token Info:`);
    console.log(`Name / Symbol: ${tokenInfo.name} / ${tokenInfo.symbol}`);
    console.log(`Address:       ${tokenInfo.address}`);
    console.log(`Decimals:      ${tokenInfo.decimals}`);
    console.groupEnd();
    console.group(`Coll. Token Info:`);
    console.log(`Name / Symbol: ${collateralTokenInfo.name} / ${collateralTokenInfo.symbol}`);
    console.log(`Address:       ${collateralTokenInfo.address}`);
    console.log(`Decimals:      ${collateralTokenInfo.decimals}`);
    console.groupEnd();
    console.groupEnd();
    console.log(SIMPLE_SEPARATOR);
}

const printPairAggregator = async ({ pairAggregator }, { tokenInfo, collateralTokenInfo }) => {
    const {
        response, collateral, pending, isInverse,
    } = await pairAggregator.getInfo()

    console.log(SIMPLE_SEPARATOR);
    console.group(`Pair Aggregator Info:`);
    console.log(`Address:       ${pairAggregator.address}`);
    console.log(`Inverse?:      ${isInverse}`);
    console.group(`Decimals Info:`);
    console.log(`Chainlink Response:    ${response.toString()}`);
    console.log(`Collateral Token:      ${collateral.toString()}`);
    console.log(`Diff. Decimals:        ${pending.toString()}`);
    console.groupEnd();

    const latestAnswer = await pairAggregator.getLatestAnswer();
    let lastestAnswerUnits = toUnits(latestAnswer, collateralTokenInfo.decimals);

    const inversePrice = BigNumber('1').div(lastestAnswerUnits);
    console.log(`Market:        ${tokenInfo.symbol} / ${collateralTokenInfo.symbol}`);
    console.log(`Response (from Wrapper):      ${latestAnswer}`);
    console.log(`Price:             1 ${tokenInfo.symbol} = ${lastestAnswerUnits.toFixed(INFO_DECIMALS)}  ${collateralTokenInfo.symbol}`);
    console.log(`Price:             1 ${collateralTokenInfo.symbol} = ${inversePrice.toFixed(INFO_DECIMALS)}  ${tokenInfo.symbol}`);

    console.groupEnd();
    console.log(SIMPLE_SEPARATOR);
}

const printCollateralInfo = ({ loanInfo, collateralInfo }, { tokenInfo, collateralTokenInfo }) => {
    const tokenName = tokenInfo.symbol;
    const tokenDecimals = tokenInfo.decimals;
    const collateralTokenName = collateralTokenInfo.symbol;
    const collateralTokenDecimals = collateralTokenInfo.decimals;

    const collRequiredCollTokensUnits = toUnits(collateralInfo.neededInCollateralTokens, collateralTokenDecimals);
    const currentCollUnits = toUnits(collateralInfo.collateral, collateralTokenDecimals);
    const collRequiredTokensUnits = toUnits(collateralInfo.neededInLendingTokens, tokenDecimals);

    const collateralRatio = BigNumber(loanInfo.loanTerms.collateralRatio).div(100);
    console.log(SIMPLE_SEPARATOR);
    console.group(`Collateral Info:`);
    console.log(`Coll. Required (in ${tokenName}):      ${collRequiredTokensUnits.toFixed(INFO_DECIMALS)} ${tokenName} (${collateralRatio}% coll. ratio)`);
    console.log(`Coll. Required (in ${collateralTokenName}):       ${collRequiredCollTokensUnits.toFixed(INFO_DECIMALS)} ${collateralTokenName}`);
    console.log(`Current Coll. (in ${collateralTokenName}):        ${currentCollUnits.toFixed(INFO_DECIMALS)} ${collateralTokenName}`);
    console.log(`More Coll. Required?:          ${collateralInfo.moreCollateralRequired}`);

    console.groupEnd();
    console.log(SIMPLE_SEPARATOR);
}

const printLoan = ({ loanInfo, totalOwed }, { tokenInfo, collateralTokenInfo }) => {
    const tokenName = tokenInfo.symbol;
    const tokenDecimals = tokenInfo.decimals;
    const collateralTokenName = collateralTokenInfo.symbol;
    const collateralTokenDecimals = collateralTokenInfo.decimals;
    console.log(SIMPLE_SEPARATOR);
    console.group(`Loan:`);
    console.log(`ID:                    ${loanInfo.id.toString()}`);
    console.log(`Escrow Address:        ${loanInfo.escrow}`);
    console.log(`Borrowed Amount:       ${loanInfo.borrowedAmount} = ${toUnits(loanInfo.borrowedAmount, tokenDecimals)} ${tokenName}`);
    console.log(`Terms Expiry:          ${loanInfo.termsExpiry} secs = ${secondsToDays(loanInfo.termsExpiry).toFixed(2)} days`);
    if(loanInfo.status.toString() === loanStatus.TermsSet.toString()) {
        console.log(`Start Time:            -- (loan is not active)`);
        console.log(`End Time:              -- (loan is not active)`);
    } else {
        console.log(`Start Time:            ${loanInfo.loanStartTime} / ${new Date(parseInt(loanInfo.loanStartTime)*1000)}`);
        const loanEndTime = parseInt(loanInfo.loanStartTime) + parseInt(loanInfo.loanTerms.duration);
        console.log(`End Time:              ${loanEndTime} / ${new Date(parseInt(loanEndTime)*1000)}`);
    }
    console.log(`Collateral:            ${loanInfo.collateral} = ${toUnits(loanInfo.collateral, collateralTokenDecimals)} ${collateralTokenName}`);

    const lastCollateralInDate = loanInfo.lastCollateralIn === '0' ? '' : new Date(parseInt(loanInfo.lastCollateralIn)*1000);
    console.log(`Last Collateral In:    ${loanInfo.lastCollateralIn} / ${lastCollateralInDate}`);
    console.log(`Principal Owed:        ${loanInfo.principalOwed} = ${toUnits(loanInfo.principalOwed, tokenDecimals)} ${tokenName}`);
    console.log(`Interest Owed:         ${loanInfo.interestOwed} = ${toUnits(loanInfo.interestOwed, tokenDecimals)} ${tokenName}`);

    const totalOwedUnits = toUnits(totalOwed, tokenDecimals);
    console.log(`Total Owed:            ${totalOwedUnits} ${tokenName}`)
    
    console.log(`Status:                ${loanInfo.status} ${JSON.stringify(loanStatus)}`);
    console.log(`Liquidated:            ${loanInfo.liquidated}`);
    console.groupEnd();
    console.log(SIMPLE_SEPARATOR);
}

module.exports = {
    printPairAggregator,
    printLoanDetails: async (
        { loans, pairAggregator, settings }, // Contract instances,
        { testContext }, // Execution context params,
        { loanId, tokenInfo, collateralTokenInfo, escrow }, // Custom params
    ) => {
        const loanInfo = await loans.loans(loanId);
        const totalOwed = await loans.getTotalOwed(loanId);
        const collateralInfo = await loans.getCollateralInfo(loanId);
        
        console.log(SEPARATOR);
        await printTokensInfo({ tokenInfo, collateralTokenInfo });

        printLoan({ loanInfo, totalOwed }, { tokenInfo, collateralTokenInfo });

        printLoanTerms({loanTerms: loanInfo.loanTerms}, {tokenInfo});

        printInterestRate({ loanInfo }, { tokenInfo });

        printCollateralInfo({loanInfo, collateralInfo}, {tokenInfo, collateralTokenInfo});

        await printPairAggregator({ pairAggregator }, { tokenInfo, collateralTokenInfo });

        await printEscrow({ settings }, { testContext }, { tokenInfo, collateralTokenInfo, escrow });

        console.log(SEPARATOR);
    },
}
