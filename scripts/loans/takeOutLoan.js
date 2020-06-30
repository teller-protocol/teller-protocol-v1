// Smart contracts

// Util classes
const BigNumber = require('bignumber.js');
const { loans: readParams } = require("../utils/cli-builder");
const assert = require('assert');
const { toDecimals } = require('../../test/utils/consts');
const { zerocollateral, tokens } = require("../../scripts/utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const processArgs = new ProcessArgs(readParams.setLoanTerms().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue('collTokenName');
        const tokenName = processArgs.getValue('tokenName');
        const senderIndex = processArgs.getValue('senderIndex');
        const loanID = processArgs.getValue('loanID');
        const loanAmount = processArgs.getValue('amount');

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(zerocollateral.custom(collateralTokenName).loans(tokenName));

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
        console.log(`${truffleCommand} --network ${processArgs.network()} --loanID ${loanID} --tokenName ${tokenName} --collTokenName ${collateralTokenName} --senderIndex ${senderIndex} --amount ${loanAmount}`);

        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};