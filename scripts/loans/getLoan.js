// Smart contracts

// Util classes
const { loans: readParams } = require("../utils/cli-builder");
const { teller, tokens } = require("../utils/contracts");
const { printFullLoan, printOraclePrice } = require("../../test/utils/printer");
const { getDecimals } = require("../../test/utils/collateral-helper");
const ProcessArgs = require('../utils/ProcessArgs');

const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

const { COLL_TOKEN_NAME, TOKEN_NAME, LOAN_ID } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.getLoan().argv);

module.exports = async (callback) => {
    try {
        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const loanId = processArgs.getValue(LOAN_ID.name);
        const getContracts = processArgs.createGetContracts(artifacts);
        const collateralTokenDecimals = await getDecimals(getContracts, collateralTokenName);

        const loansInstance = await getContracts.getDeployed(teller.custom(collateralTokenName).loans(tokenName));
        const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const pairAggregatorAddress = await loansInstance.priceOracle();
        const oracleInstance = await ChainlinkPairAggregator.at(pairAggregatorAddress);

        const loanIDCounter = await loansInstance.loanIDCounter();
        const loanCounter = parseInt(loanIDCounter.toString());

        const tokenDecimals = parseInt(await tokenInstance.decimals());
        const loanInfo = await loansInstance.loans(loanId);

        console.log(`Total # Loans (${tokenName}): ${loanCounter}`);
        console.log('-'.repeat(70));

        const latestAnswer  = await oracleInstance.getLatestAnswer();
        const latestTimestamp = await oracleInstance.getLatestTimestamp();

        printOraclePrice(
            web3,
            { tokenName, tokenDecimals, collateralTokenName, collateralTokenDecimals },
            { latestAnswer, oracleAddress: oracleInstance.address },
            latestTimestamp,
        );
        console.log('-'.repeat(70));

        await printFullLoan(
            web3,
            { tokenName, tokenDecimals, collateralTokenDecimals, collateralTokenName },
            { latestAnswer, oracleAddress: oracleInstance.address },
            loanInfo
        );
        
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
