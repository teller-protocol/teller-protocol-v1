// Smart contracts

// Util classes
const { oracle: readParams } = require("../utils/cli-builder");
const { tokens, teller } = require("../../scripts/utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const { toUnits } = require("../../test/utils/consts");
const { TOKEN_NAME, COLL_TOKEN_NAME, BACK_ROUNDS } = require("../utils/cli/names");

const processArgs = new ProcessArgs(readParams.getPrices().argv);

module.exports = async (callback) => {
    try {

        const collTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const roundsBack = processArgs.getValue(BACK_ROUNDS.name);

        const getContracts = processArgs.createGetContracts(artifacts);        
        const chainlinkAggregatorAggregator = await getContracts.getDeployed(teller.oracles().custom(tokenName, collTokenName));
        const targetToken = collTokenName.toUpperCase() === 'ETH' ?  undefined: await getContracts.getDeployed(tokens.get(collTokenName));

        const targetTokenDecimals = targetToken === undefined ? 18: await targetToken.decimals();
        
        console.log(`Chainlink Aggregator => ${tokenName} / ${collTokenName}: `);
        console.log(`${'-'.repeat(60)}`);

        const getLatestAnswerResult = await chainlinkAggregatorAggregator.getLatestAnswer();
        console.log(`Lastest Answer:        1 ${tokenName} = ${getLatestAnswerResult.toString()} = ${toUnits(getLatestAnswerResult.toString(), targetTokenDecimals)} ${collTokenName}`);

        const getLatestTimestampResult = parseInt(await chainlinkAggregatorAggregator.getLatestTimestamp()) * 1000;
        console.log(`Latest Timestamp:      ${getLatestTimestampResult} ms = ${new Date(getLatestTimestampResult).toISOString()}`);

        const getPreviousAnswerResult = await chainlinkAggregatorAggregator.getPreviousAnswer(roundsBack);
        console.log(`Previous Answer:       1 ${tokenName} = ${getPreviousAnswerResult.toString()} = ${toUnits(getPreviousAnswerResult.toString(), targetTokenDecimals)} ${collTokenName}`);

        const getPreviousTimestampResult = parseInt(await chainlinkAggregatorAggregator.getPreviousTimestamp(roundsBack)) * 1000;
        console.log(`Previous Timestamp:    ${getPreviousTimestampResult.toString()} ms = ${new Date(getPreviousTimestampResult).toISOString()}`);
        console.log(`${'-'.repeat(60)}`);
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
