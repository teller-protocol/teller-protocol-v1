// Smart contracts
const IAggregator = artifacts.require("@chainlink/contracts/src/v0.5/interfaces/AggregatorInterface.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const { toUnits } = require('../../test/utils/consts');
const processArgs = new ProcessArgs();

const sourceTokenName = 'LINK'.toUpperCase();
const targetTokenName = 'USD'.toUpperCase();
const back = 1;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../../config')(network);
        const { chainlink } = appConf.networkConfig;

        const aggregatorInfo = chainlink[`${sourceTokenName}_${targetTokenName}`];
        assert(aggregatorInfo, "Aggregator info is undefined.");

        console.log(`Using Chainlink Oracle address: '${aggregatorInfo.address}'`);
        const aggregator = await IAggregator.at(aggregatorInfo.address);

        console.log(`Chainlink Aggregator => ${sourceTokenName} / ${targetTokenName}: `);
        console.log(`${'-'.repeat(60)}`);

        const getLatestAnswerResult = await aggregator.latestAnswer();
        console.log(`Lastest Answer:        1 ${sourceTokenName} = ${getLatestAnswerResult.toString()} = ${toUnits(getLatestAnswerResult.toString(), aggregatorInfo.responseDecimals)} ${targetTokenName}`);

        const getLatestTimestampResult = parseInt(await aggregator.latestTimestamp()) * 1000;
        console.log(`Latest Timestamp:      ${getLatestTimestampResult} ms = ${new Date(getLatestTimestampResult).toISOString()}`);

        const getAnswerResult = await aggregator.getAnswer(back);
        console.log(`Previous Answer:       1 ${sourceTokenName} = ${getAnswerResult.toString()} = ${toUnits(getAnswerResult.toString(), aggregatorInfo.responseDecimals)} ${targetTokenName}`);

        const getTimestampResult = parseInt(await aggregator.getTimestamp(back)) * 1000;
        console.log(`Previous Timestamp:    ${getTimestampResult.toString()} ms = ${new Date(getTimestampResult).toISOString()}`);
        console.log(`${'-'.repeat(60)}`);
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
