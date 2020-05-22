// Smart contracts
//const LoansInterface = artifacts.require("./interfaces/LoansInterface.sol");
const LoansInterface = artifacts.require("./base/Loans.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

// Parameters
const loanId = 0;
const tokenName = 'USDC';

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../../config')(network);
        const { zerocollateral } = appConf.networkConfig;

        assert(tokenName, "Token name is undefined.");
        const loansAddress = zerocollateral[`Loans_z${tokenName}`];
        assert(loansAddress, "Loans address is undefined.");

        const loansInstance = await LoansInterface.at(loansAddress);

        const loanInfo = await loansInstance.loans(loanId);
        console.log('Loan info:');
        console.log('-'.repeat(10));
        console.log(`Id:                ${loanInfo.id}`);
        console.log(`Loan Terms:`);
        console.log(`\tBorrower:            ${loanInfo.loanTerms.borrower}`);
        console.log(`\tRecipient:           ${loanInfo.loanTerms.recipient}`);
        console.log(`\tInterest Rate:       ${loanInfo.loanTerms.interestRate}`);
        console.log(`\tCollateral Ratio:    ${loanInfo.loanTerms.collateralRatio}`);
        console.log(`\tMax. Loan Amount:    ${loanInfo.loanTerms.maxLoanAmount}`);
        console.log(`\tDuration:            ${loanInfo.loanTerms.duration}`);
        console.log(`Terms Expiry:          ${loanInfo.termsExpiry}`);
        console.log(`Start Time:            ${loanInfo.loanStartTime.toString()}`);
        console.log(`Current Collateral:    ${loanInfo.collateral}`);
        console.log(`Last Collateral In:    ${loanInfo.lastCollateralIn.toString()}`);
        console.log(`Principal Owed:        ${loanInfo.principalOwed.toString()}`);
        console.log(`Interest Owed:         ${loanInfo.interestOwed.toString()}`);
        console.log(`Status:                ${loanInfo.status.toString()}`);
        console.log(`Liquidated:            ${loanInfo.liquidated.toString()}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
