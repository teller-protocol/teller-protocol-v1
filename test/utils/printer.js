const BigNumber = require('bignumber.js');
const loanStatus = require("./loanStatus");
const LoanInfoPrinter = require('./printers/LoanInfoPrinter');
const { secondsToDays, toUnits } = require("./consts");

const YEAR = 365;

const printInterestRate = ({ tokenName, tokenDecimals }, loanTerms, amountWithUnits) => {
    console.group(`Interest Rate:`);
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
}

const printLoanTerms = ({ tokenName, tokenDecimals }, loanTerms) => {
    console.group('Loan Terms:')
    console.log(`Borrower:          ${loanTerms.borrower}`);
    console.log(`Recipient:         ${loanTerms.recipient}`);
    const durationInDays = secondsToDays(loanTerms.duration);
    console.log(`Duration:          ${loanTerms.duration} sec = ${durationInDays} days`);
    console.log(`Collateral Ratio:  ${loanTerms.collateralRatio} == ${BigNumber(loanTerms.collateralRatio).div(100)} % = ${BigNumber(loanTerms.collateralRatio).div(10000)}`);
    
    const maxLoanAmountUnits = toUnits(loanTerms.maxLoanAmount, tokenDecimals);
    console.log(`Max. Loan Amount:  ${loanTerms.maxLoanAmount} = ${maxLoanAmountUnits} ${tokenName}`);
    console.groupEnd();
}

const printLoan = (loanInfo, { tokenName, tokenDecimals, collateralTokenName, collateralTokenDecimals }) => {
    console.group(`Loan:`);
    console.log(`ID:                    ${loanInfo.id.toString()}`);
    console.log(`Escrow Address:        ${loanInfo.escrow}`);
    console.log(`Borrowed Amount:       ${loanInfo.borrowedAmount} = ${toUnits(loanInfo.borrowedAmount, tokenDecimals)} ${tokenName}`);
    console.log(`Terms Expiry:          ${loanInfo.termsExpiry} secs = ${secondsToDays(loanInfo.termsExpiry).toFixed(2)} days`);
    if(loanInfo.status === loanStatus.TermsSet) {
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
    console.log(`Status:                ${loanInfo.status} ${JSON.stringify(loanStatus)}`);
    console.log(`Liquidated:            ${loanInfo.liquidated}`);
    console.groupEnd();
}

const printOraclePrice = (
    web3,
    {tokenName, tokenDecimals, collateralTokenName, collateralTokenDecimals},
    { latestAnswer, oracleAddress },
    latestTimestamp
) => {
    console.group(`Oracle Price:`);
    console.log(`Aggregator Address:    ${oracleAddress}`);
    console.log(`Pair:                  ${tokenName} / ${collateralTokenName}`);
    const latestAnswerUnits = toUnits(latestAnswer, collateralTokenDecimals);
    console.log(`Lastest Answer:        1 ${tokenName} = ${latestAnswer.toString()} = ${latestAnswerUnits.toString()} ${collateralTokenName}`);
    const latestTimestampInt = parseInt(latestTimestamp.toString()) * 1000;
    console.log(`Latest Timestamp:      ${latestTimestampInt} ms = ${new Date(latestTimestampInt).toISOString()}`);
    console.groupEnd();
}

const printCollateral = async (
    web3,
    {tokenName, tokenDecimals, collateralTokenName, collateralTokenDecimals},
    latestAnswer,
    loanInfo
) => {
    const printer = new LoanInfoPrinter(
        web3,
        loanInfo,
        { tokenName, decimals: tokenDecimals},
        { tokenName: collateralTokenName, decimals: collateralTokenDecimals },
    );
    console.group('Collateral / Liquidation Info:');
    console.log(`Total Principal:       ${printer.getOwedValues().principalOwed} = ${printer.getOwedValuesUnit().principalOwedUnit} ${tokenName}`);
    console.log(`Total Interest:        ${printer.getOwedValues().interestOwed} = ${printer.getOwedValuesUnit().interestOwedUnit} ${tokenName}`);
    console.log(`Total Owed:            ${printer.getTotalOwed()} = ${printer.getTotalOwedUnits()} ${tokenName} (principal + interest)`);
    const {
        collateralRatio,
        collateralRatioDecimals,
        collateralRatioPercentage
    } = printer.getCollateralRatioValues();
    const collateralNeededInTokens = printer.getCollateralNeededInTokens();
    console.log(`Coll. Ratio (value/%/decimals):    ${collateralRatio.toFixed(0)} = ${collateralRatioPercentage.toString()} % = ${collateralRatioDecimals}`);
    console.log(`Coll. Needed (Tokens):             ${collateralNeededInTokens.toFixed(0)} ${tokenName} (${collateralRatioPercentage}% of ${printer.getTotalOwed()} ${tokenName} -total owed-) => Total owed in ${tokenName}`);
    
    const latestAnswerEther = toUnits(latestAnswer.toString(), collateralTokenDecimals);
    console.log(`Lastest Price (${tokenName}/${collateralTokenName}):    1 ${tokenName} = ${latestAnswer.toString()} = ${latestAnswerEther.toString()} ${collateralTokenName}`);
    console.log(`Whole Token (${tokenName} / ${tokenDecimals}):        ${printer.getAWholeToken()} = 1 ${tokenName}`)
    /**
        1 token                         = latestAnswer
        collateralNeededInTokens tokens = X = collateralNeededInTokens * latestAnswer
     */
    console.log(`Start Time:            ${printer.getStartTime()} / ${printer.getStartDate()}`);
    console.log(`End Time:              ${printer.getEndTime()} / ${printer.getEndDate()}`);
    console.groupEnd();
    console.group('Collateral');
    console.log(`Current Collateral (A):        ${printer.getCollateral()} = ${printer.getCollateralUnits()} ${collateralTokenName}`);
    console.log(`Collateral. Needed (B):        ${printer.getCollateralNeededInWeis(latestAnswer).toFixed(0)} = ${printer.getCollateralNeededInWeisUnit(latestAnswer)} ${collateralTokenName} = (Coll. Needed (Tokens) * Lastest Price ${tokenName}/${collateralTokenName})`);
    console.log(`Need Collateral (B > A)?:      ${printer.isCollateralNeededGtCollateral(latestAnswer)}`);
    const nowTime = await printer.getNowTime();
    const nowDate = await printer.getNowDate();
    console.log(`Now:                           ${nowTime} / ${nowDate}`);
    console.log(`EndTime > Now?:                ${(await printer.isEndTimeLtNow())}`);
    console.log(`Liquidable?:                   ${(await printer.isLiquidable(latestAnswer))}`);
    console.groupEnd();
}

module.exports = {
    printLoanTerms,
    printLoan,
    printOraclePrice,
    printCollateral,
    printFullLoan: async (
        web3,
        { tokenName, tokenDecimals, collateralTokenName, collateralTokenDecimals },
        { latestAnswer, oracleAddress, },
        loanInfo
    ) => {
        const times = 130;
        const main = times + 30;
        console.log('='.repeat(main));
        printLoan(
            loanInfo,
            { tokenName, tokenDecimals, collateralTokenName, collateralTokenDecimals },
        );
        const loanTerms = loanInfo.loanTerms;
        console.log('-'.repeat(times));
        printLoanTerms({ tokenName, tokenDecimals }, loanTerms);
        console.log('-'.repeat(times));
        
        if(loanInfo.borrowedAmount !== 0) {
            const borrowedAmountUnits = toUnits(loanInfo.borrowedAmount, tokenDecimals);
            printInterestRate({ tokenName, tokenDecimals }, loanTerms, borrowedAmountUnits);
        } else {
            const maxLoanAmountUnits = toUnits(loanTerms.maxLoanAmount, tokenDecimals);
            printInterestRate({ tokenName, tokenDecimals }, loanTerms, maxLoanAmountUnits);
        }
        console.log('-'.repeat(times));
        await printCollateral(
            web3,
            { tokenName, tokenDecimals, collateralTokenName, collateralTokenDecimals },
            latestAnswer,
            loanInfo
        );
        console.log('='.repeat(main));
    },
}
