// Smart contracts

// Util classes
const assert = require('assert');
const { oracle: readParams } = require("../utils/cli-builder");
const { chainlink } = require("../utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const { toUnits } = require("../../test/utils/consts");
const { TOKEN_NAME, COLL_TOKEN_NAME, BACK_ROUNDS } = require("../utils/cli/names");

const processArgs = new ProcessArgs(readParams.getPrices().argv);

module.exports = async (callback) => {
    try {
        const { chainlink: chainlinkConf } = processArgs.appConf.networkConfig;
        const collTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const roundsBack = processArgs.getValue(BACK_ROUNDS.name);

        const getContracts = processArgs.createGetContracts(artifacts);        
        const aggregator = await getContracts.getDeployed(chainlink.custom(tokenName, collTokenName));

        const aggregatorInfo = chainlinkConf[`${tokenName}_${collTokenName}`];
        assert(aggregatorInfo, "Aggregator info is undefined.");

        console.log(`Chainlink Aggregator => ${tokenName} / ${collTokenName}: `);
        console.log(`${'-'.repeat(60)}`);

        const getLatestAnswerResult = await aggregator.latestAnswer();
        console.log(`Lastest Answer:        1 ${tokenName} = ${getLatestAnswerResult.toString()} = ${toUnits(getLatestAnswerResult.toString(), aggregatorInfo.responseDecimals)} ${collTokenName}`);

        const getLatestTimestampResult = parseInt(await aggregator.latestTimestamp()) * 1000;
        console.log(`Latest Timestamp:      ${getLatestTimestampResult} ms = ${new Date(getLatestTimestampResult).toISOString()}`);

        const getAnswerResult = await aggregator.getAnswer(roundsBack);
        console.log(`Previous Answer:       1 ${tokenName} = ${getAnswerResult.toString()} = ${toUnits(getAnswerResult.toString(), aggregatorInfo.responseDecimals)} ${collTokenName}`);

        const getTimestampResult = parseInt(await aggregator.getTimestamp(roundsBack)) * 1000;
        console.log(`Previous Timestamp:    ${getTimestampResult.toString()} ms = ${new Date(getTimestampResult).toISOString()}`);
        console.log(`${'-'.repeat(60)}`);
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
