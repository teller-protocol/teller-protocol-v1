// Smart contracts

// Util classes
const { zerocollateral, tokens } = require("../utils/contracts");
const { printFullLoan, printOraclePrice } = require("../../test/utils/printer");
const { loans: readParams } = require("../utils/cli-builder");

const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs(readParams.listLoans().argv);

module.exports = async (callback) => {
    try {
        const getContracts = processArgs.createGetContracts(artifacts);

        const collTokenName = processArgs.getValue('collTokenName');
        const tokenName = processArgs.getValue('tokenName');
        const startLoanId = processArgs.getValue('initialLoanId');
        const endLoanId = processArgs.getValue('finalLoanId');

        const loansInstance = await getContracts.getDeployed(zerocollateral.custom(collTokenName).loans(tokenName));
        const oracleInstance = await getContracts.getDeployed(zerocollateral.oracles().custom(tokenName, collTokenName));
        const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));

        const loanIDCounter = await loansInstance.loanIDCounter();
        const loanCounter = parseInt(loanIDCounter.toString());

        console.log(`Total # Loans (${tokenName}): ${loanCounter}`);
        console.log('-'.repeat(70));

        const latestAnswer  = await oracleInstance.getLatestAnswer();
        const latestTimestamp = await oracleInstance.getLatestTimestamp();
        printOraclePrice(web3, tokenName, latestAnswer, latestTimestamp);
        console.log('-'.repeat(70));

        const tokenDecimals = parseInt(await tokenInstance.decimals());

        let currentLoanId = startLoanId;
        while ( currentLoanId < endLoanId && currentLoanId < loanCounter) {
            const loanInfo = await loansInstance.loans(currentLoanId);
            printFullLoan(web3, {tokenName, tokenDecimals}, latestAnswer, loanInfo);
            currentLoanId++;
        }

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
