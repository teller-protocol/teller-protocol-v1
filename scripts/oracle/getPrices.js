// Smart contracts

// Util classes
const { oracle: readParams } = require("../utils/cli-builder");
const { tokens, teller } = require("../../scripts/utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const { toDecimals, toUnits, ETH_ADDRESS } = require("../../test/utils/consts");
const { BASE_TOKEN_NAME, QUOTE_TOKEN_NAME, AMOUNT } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.getPrices().argv);

module.exports = async (callback) => {
    try {

        const baseTokenName = processArgs.getValue(BASE_TOKEN_NAME.name);
        const quoteTokenName = processArgs.getValue(QUOTE_TOKEN_NAME.name);
        const amount = processArgs.getValue(AMOUNT.name);

        const getContracts = processArgs.createGetContracts(artifacts);        
        const chainlinkAggregator = await getContracts.getDeployed(teller.chainlinkAggregator());
        const baseToken = baseTokenName.toUpperCase() === 'ETH' ?  {address: ETH_ADDRESS, decimals: async () => Promise.resolve(18) }: await getContracts.getDeployed(tokens.get(baseTokenName));
        const quoteToken = quoteTokenName.toUpperCase() === 'ETH' ?  {address: ETH_ADDRESS, decimals: async () => Promise.resolve(18) }: await getContracts.getDeployed(tokens.get(quoteTokenName));

        const decimals = await baseToken.decimals()
        const amountWithDecimals = toDecimals(amount, decimals.toString()).toFixed(0);

        const quoteTokenDecimals = await quoteToken.decimals();
        
        console.log(`Chainlink Aggregator => ${baseTokenName} / ${quoteTokenName}: `);
        console.log(`${'-'.repeat(60)}`);

        const getLatestAnswerResult = await chainlinkAggregator.latestAnswerFor(baseToken.address, quoteToken.address);
        console.log(`Lastest Answer:        1 ${baseTokenName} = ${getLatestAnswerResult.toString()} = ${toUnits(getLatestAnswerResult.toString(), quoteTokenDecimals)} ${quoteTokenName}`);

        const latestValueResult = await chainlinkAggregator.valueFor(baseToken.address, quoteToken.address, amountWithDecimals);
        console.log(`Lastest Value:         ${amount} ${baseTokenName} = ${latestValueResult.toString()} = ${toUnits(latestValueResult.toString(), quoteTokenDecimals)} ${quoteTokenName}`);

        console.log(`${'-'.repeat(60)}`);
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
