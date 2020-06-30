// Smart contracts
const PairAggregatorMock = artifacts.require('./mock/providers/chainlink/PairAggregatorMock.sol');

// Util classes
const BigNumber = require('bignumber.js');
BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 });
const { ganache: readParams } = require("../utils/cli-builder");
const { getDecimals, getOracleAggregatorInfo } = require("../../test/utils/collateral-helper");
const ProcessArgs = require('../utils/ProcessArgs');
const { toDecimals } = require('../../test/utils/consts');
const processArgs = new ProcessArgs(readParams.setOraclePrice().argv);

module.exports = async (callback) => {
    try {
        const tokenName = processArgs.getValue('tokenName');
        const collTokenName = processArgs.getValue('collTokenName');
        const newValue = processArgs.getValue('newValue');

        const getContracts = processArgs.createGetContracts(artifacts);

        const oracleAggregatorInstance = await getContracts.getDeployed(getOracleAggregatorInfo(tokenName, collTokenName));

        const chainlinkAggregatorAddress = await oracleAggregatorInstance.aggregator();

        const chainlinkAggregator = await PairAggregatorMock.at(chainlinkAggregatorAddress);

        const collTokenDecimals = await getDecimals(getContracts, collTokenName);
        const tokenDecimals = await getDecimals(getContracts, tokenName);

        const tokenWhole = await toDecimals(1, tokenDecimals);
        const collNewValueWhole = await toDecimals(newValue, collTokenDecimals);

        const currentOraclePrice = await chainlinkAggregator.latestAnswer();
        console.log();
        console.log('Current Price');
        console.log(`${tokenWhole} ${tokenName} == ${currentOraclePrice.toString()} ${collTokenName}`);

        console.log();
        console.log('New Price');
        console.log(`${tokenWhole} ${tokenName} == ${collNewValueWhole} ${collTokenName}`);

        await chainlinkAggregator.setLatestAnswer(collNewValueWhole);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};