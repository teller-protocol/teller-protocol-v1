// Smart contracts
//const LoansInterface = artifacts.require("./interfaces/LoansInterface.sol");
const LoansInterface = artifacts.require("./base/Loans.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('./utils/ProcessArgs');
const processArgs = new ProcessArgs();

// Parameters
const loanId = 0;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../config')(network);
        const { zerocollateral } = appConf.networkConfig;

        assert(zerocollateral.Loans, "Loans address is undefined.");

        const loansInstance = await LoansInterface.at(zerocollateral.Loans);

        const loanInfo = await loansInstance.loans(loanId);
        console.log('Loan info:');
        console.log('-'.repeat(10));
        console.log(`Id:                ${loanInfo.id}`);
        console.log(`Collateral:        ${loanInfo.collateral}`);
        console.log(`Max Loan Amount:   ${loanInfo.maxLoanAmount}`);
        console.log(`Total Owed:        ${loanInfo.totalOwed}`);
        console.log(`Time Start:        ${loanInfo.timeStart}`);
        console.log(`Time End:          ${loanInfo.timeEnd}`);
        console.log(`Interest Rate:     ${loanInfo.interestRate}`);
        console.log(`Collateral Ratio:  ${loanInfo.collateralRatio}`);
        console.log(`Borrower:          ${loanInfo.borrower}`);
        console.log(`Active?:           ${loanInfo.active}`);
        console.log(`Liquidated?:       ${loanInfo.liquidated}`);
        
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
