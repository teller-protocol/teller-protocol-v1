// Smart contracts

// Util classes
const { zerocollateral, tokens } = require("../utils/contracts");
const { printFullLoan, printOraclePrice } = require("../../test/utils/printer");
const { loans: readParams } = require("../utils/cli-builder");
const { getOracleAggregatorInfo, getDecimals } = require("../../test/utils/collateral-helper");

const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs(readParams.listLoans().argv);

module.exports = async (callback) => {
    try {
        const getContracts = processArgs.createGetContracts(artifacts);

        const collateralTokenName = processArgs.getValue('collTokenName');
        const tokenName = processArgs.getValue('tokenName');
        const startLoanId = processArgs.getValue('initialLoanId');
        const endLoanId = processArgs.getValue('finalLoanId');

        const loansInstance = await getContracts.getDeployed(zerocollateral.custom(collateralTokenName).loans(tokenName));

        const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const tokenDecimals = parseInt(await tokenInstance.decimals());
        const collateralTokenDecimals = await getDecimals(getContracts, collateralTokenName);
        const oracleInstance = await getContracts.getDeployed(getOracleAggregatorInfo(tokenName, collateralTokenName));

        const loanIDCounter = await loansInstance.loanIDCounter();
        const loanCounter = parseInt(loanIDCounter.toString());

        console.log(`Total # Loans (${tokenName}): ${loanCounter}`);
        console.log('-'.repeat(70));

        const latestAnswer  = await oracleInstance.getLatestAnswer();
        const latestTimestamp = await oracleInstance.getLatestTimestamp();
        printOraclePrice(
            web3,
            { tokenName, tokenDecimals, collateralTokenName, collateralTokenDecimals },
            { latestAnswer, oracleAddress: oracleInstance.address },
            latestTimestamp
        );
        console.log('-'.repeat(70));

        let currentLoanId = startLoanId;
        while ( currentLoanId < endLoanId && currentLoanId < loanCounter) {
            const loanInfo = await loansInstance.loans(currentLoanId);
            await printFullLoan(
                web3,
                { tokenName, tokenDecimals, collateralTokenName, collateralTokenDecimals },
                { latestAnswer, oracleAddress: oracleInstance.address },
                loanInfo
            );
            currentLoanId++;
        }

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
