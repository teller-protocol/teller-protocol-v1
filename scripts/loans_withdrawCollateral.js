// Smart contracts
const LoansInterface = artifacts.require("./base/Loans.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('./utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const loanId = 0;
const borrowerIndex = 0;
const amount = 10;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../config')(network);
        const { zerocollateral, toTxUrl } = appConf.networkConfig;

        assert(zerocollateral.Loans, "Loans address is undefined.");

        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const borrower = accounts[borrowerIndex];
        assert(borrower, "Borrower must be defined.");

        console.log(`Loan ID:       ${loanId}`);
        console.log(`Borrower:      ${borrowerIndex} => ${borrower}`);
        console.log(`Amount:        ${amount} WEI`);

        const loansInstance = await LoansInterface.at(zerocollateral.Loans);

        const result = await loansInstance.withdrawCollateral(amount, loanId, { from: borrower });
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
