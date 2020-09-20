// Smart contracts

// Util classes
const { loans: readParams } = require("../utils/cli-builder");
const { toDecimals } = require('../../test/utils/consts');
const { teller, tokens } = require("../../scripts/utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const { COLL_TOKEN_NAME, TOKEN_NAME, SENDER_INDEX, LOAN_ID, AMOUNT } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.takeOut().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const loanID = processArgs.getValue(LOAN_ID.name);
        const loanAmount = processArgs.getValue(AMOUNT.name);

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(teller.custom(collateralTokenName).loans(tokenName));

        const lendingTokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const lendingTokenDecimals = await lendingTokenInstance.decimals();
        const loanAmountWithDecimals = toDecimals(loanAmount, lendingTokenDecimals.toString()).toFixed(0);

        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);

        const result = await loansInstance.takeOutLoan(
            loanID,
            loanAmountWithDecimals,
            senderTxConfig
        );

        console.log('To repay the loan, execute: ');
        const truffleCommand = 'truffle exec ./scripts/loans/repay.js';
        console.log(`${truffleCommand} --network ${processArgs.network()} --loanId ${loanID} --tokenName ${tokenName} --collTokenName ${collateralTokenName} --senderIndex ${senderIndex} --amount ${loanAmount}`);

        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};