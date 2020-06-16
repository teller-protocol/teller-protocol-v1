// Smart contracts

// Util classes
const { tokens, zerocollateral } = require("../../scripts/utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const { toUnits } = require("../../test/utils/consts");

const processArgs = new ProcessArgs();

const sourceTokenName = 'DAI'.toUpperCase();
const targetTokenName = 'ETH'.toUpperCase();
const back = 1;

module.exports = async (callback) => {
    try {
        const getContracts = processArgs.createGetContracts(artifacts);        
        const chainlinkAggregatorAggregator = await getContracts.getDeployed(zerocollateral.oracles().custom(sourceTokenName, targetTokenName));
        const targetToken = targetTokenName.toUpperCase() === 'ETH' ?  undefined: await getContracts.getDeployed(tokens.get(targetTokenName));

        const targetTokenDecimals = targetToken === undefined ? 18: await targetToken.decimals();
        
        console.log(`Chainlink Aggregator => ${sourceTokenName} / ${targetTokenName}: `);
        console.log(`${'-'.repeat(60)}`);

        const getLatestAnswerResult = await chainlinkAggregatorAggregator.getLatestAnswer();
        console.log(`Lastest Answer:        1 ${sourceTokenName} = ${getLatestAnswerResult.toString()} = ${toUnits(getLatestAnswerResult.toString(), targetTokenDecimals)} ${targetTokenName}`);

        const getLatestTimestampResult = parseInt(await chainlinkAggregatorAggregator.getLatestTimestamp()) * 1000;
        console.log(`Latest Timestamp:      ${getLatestTimestampResult} ms = ${new Date(getLatestTimestampResult).toISOString()}`);

        const getPreviousAnswerResult = await chainlinkAggregatorAggregator.getPreviousAnswer(back);
        console.log(`Previous Answer:       1 ${sourceTokenName} = ${getPreviousAnswerResult.toString()} = ${toUnits(getPreviousAnswerResult.toString(), targetTokenDecimals)} ${targetTokenName}`);

        const getPreviousTimestampResult = parseInt(await chainlinkAggregatorAggregator.getPreviousTimestamp(back)) * 1000;
        console.log(`Previous Timestamp:    ${getPreviousTimestampResult.toString()} ms = ${new Date(getPreviousTimestampResult).toISOString()}`);
        console.log(`${'-'.repeat(60)}`);
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
