// Smart contracts

// Util classes
const { teller, tokens } = require("../utils/contracts");
const { loans: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const { toDecimals } = require('../../test/utils/consts');
const LoanInfoPrinter = require('../../test/utils/printers/LoanInfoPrinter');
const { COLL_TOKEN_NAME, SENDER_INDEX, TOKEN_NAME, AMOUNT } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.repayLast().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const repayAmount = processArgs.getValue(AMOUNT.name);

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(teller.custom(collateralTokenName).loans(tokenName));
        const lendingTokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const lendingTokenDecimals = await lendingTokenInstance.decimals();

        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);
        const repayAmountWithDecimals = toDecimals(repayAmount, lendingTokenDecimals);
        const lendingPoolAddress = await loansInstance.lendingPool();

        const borrowerLoanIDs = await loansInstance.getBorrowerLoans(senderTxConfig.from);

        if(borrowerLoanIDs.length === 0) {
            callback(`Borrower ${senderTxConfig.from} has not borrowed loans.`);
        }

        const lastLoanID = borrowerLoanIDs[borrowerLoanIDs.length - 1];
        const loanInfo = await  loansInstance.loans(lastLoanID);

        const loanInfoPrinter = new LoanInfoPrinter(
            web3,
            loanInfo, 
            { tokenName, decimals: lendingTokenDecimals },
        );
        if(! loanInfoPrinter.isActive()) {
            callback(`Loan ID ${lastLoanID} for borrower ${senderTxConfig.from} is not active. Status: ${loanInfoPrinter.loanInfo.status}`);
        }

        const totalOwedWithDecimals = loanInfoPrinter.getTotalOwed();

        const amountToRepay = repayAmountWithDecimals.toString() === '0' ? totalOwedWithDecimals : repayAmountWithDecimals;
        console.log(`Amount to repay: ${amountToRepay.toString()}`);
        console.log(`Parameter: ${repayAmountWithDecimals.toString()}`);
        console.log(`Total Owed: ${totalOwedWithDecimals.toString()}`);

        await lendingTokenInstance.approve(lendingPoolAddress, amountToRepay.toString(), senderTxConfig);
        const result = await loansInstance.repay(
            amountToRepay,
            lastLoanID,
            senderTxConfig
        );
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};