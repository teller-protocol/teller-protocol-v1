// Smart contracts
const LoansInterface = artifacts.require("./interfaces/LoansInterface.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

const borroweAddress = '0xE1F8feA4699Ce3e0196923E6fA16F773600E59e0';
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
        
        const loanIds = await loansInstance.getBorrowerLoans(borroweAddress);
        
        console.log(`Token:     ${tokenName}`);
        console.log(`Borrower:  ${borroweAddress}`);
        console.log(`# Loans:   ${loanIds.length}`);
        for (const loanId of loanIds) {
            const lastLoan = loanIds.indexOf(loanId) === loanIds.length - 1 ? '<<< Last Loan >>>' : '';
            console.log(`Loan ID: ${loanId} ${lastLoan}`);
        }
        
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
