// Smart contracts

// Util classes
const { teller, tokens } = require("../utils/contracts");
const { printFullLoan, printOraclePrice } = require("../../test/utils/printer");
const { loans: readParams } = require("../utils/cli-builder");
const { getDecimals } = require("../../test/utils/collateral-helper");

const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

const ProcessArgs = require('../utils/ProcessArgs');
const { COLL_TOKEN_NAME, TOKEN_NAME, INITIAL_LOAN_ID, FINAL_LOAN_ID } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.listLoans().argv);

module.exports = async (callback) => {
    try {
        const getContracts = processArgs.createGetContracts(artifacts);

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const startLoanId = processArgs.getValue(INITIAL_LOAN_ID.name);
        const endLoanId = processArgs.getValue(FINAL_LOAN_ID.name);

        const loansInstance = await getContracts.getDeployed(teller.custom(collateralTokenName).loans(tokenName));

        const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const tokenDecimals = parseInt(await tokenInstance.decimals());
        const collateralTokenDecimals = await getDecimals(getContracts, collateralTokenName);
        const pairAggregatorAddress = await loansInstance.priceOracle();
        const oracleInstance = await ChainlinkPairAggregator.at(pairAggregatorAddress);

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
