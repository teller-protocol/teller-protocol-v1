// Smart contracts

// Util classes
const { loans: readParams } = require("../utils/cli-builder");
const { toDecimals } = require('../../test/utils/consts');
const { teller, tokens } = require("../utils/contracts");
const LoanInfoPrinter = require('../../test/utils/printers/LoanInfoPrinter');
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const { COLL_TOKEN_NAME, TOKEN_NAME, SENDER_INDEX, AMOUNT } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.takeOutLast().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const loanAmount = processArgs.getValue(AMOUNT.name);

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(teller.custom(collateralTokenName).loans(tokenName));

        const lendingTokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const lendingTokenDecimals = await lendingTokenInstance.decimals();
        const loanAmountWithDecimals = toDecimals(loanAmount, lendingTokenDecimals.toString()).toFixed(0);

        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);

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
        if(! loanInfoPrinter.isTermsSet()) {
            callback(`Loan ID ${lastLoanID} for borrower ${senderTxConfig.from} is not TermsSet. Status: ${loanInfoPrinter.loanInfo.status}`);
        }


        const amountToBorrow = loanAmountWithDecimals === '0' ? maxLoanAmount : loanAmountWithDecimals;

        const result = await loansInstance.takeOutLoan(
            lastLoanID,
            amountToBorrow,
            senderTxConfig
        );

        console.log('To repay the loan, execute: ');
        const truffleCommand = 'truffle exec ./scripts/loans/repay.js';
        console.log(`${truffleCommand} --network ${processArgs.network()} --loanID ${lastLoanID} --tokenName ${tokenName} --collTokenName ${collateralTokenName} --senderIndex ${senderIndex} --amount ${amountToBorrow}`);

        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};