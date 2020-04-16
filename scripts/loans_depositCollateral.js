// Smart contracts
const LoansInterface = artifacts.require("./base/Loans.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('./utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const loanId = 0;
const senderIndex = 1;
const borrowerIndex = 0;
const collateralValue = 40000000;

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
        const sender = accounts[senderIndex];
        assert(sender, "Sender must be defined.");

        console.log(`Loan ID:       ${loanId}`);
        console.log(`Borrower:      ${borrowerIndex} => ${borrower}`);
        console.log(`Sender:        ${senderIndex} => ${sender}`);
        console.log(`Collateral:    ${collateralValue} WEI => ${web3.utils.fromWei(collateralValue.toString(), 'ether')} ETH`);

        const loansInstance = await LoansInterface.at(zerocollateral.Loans);

        const result = await loansInstance.depositCollateral(borrower, loanId, { from: sender, value: collateralValue});
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};