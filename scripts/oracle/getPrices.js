// Smart contracts

// Util classes
const { oracle: readParams } = require("../utils/cli-builder");
const { tokens, teller } = require("../../scripts/utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const { toDecimals, toUnits, ETH_ADDRESS } = require("../../test/utils/consts");
const { TOKEN_NAME, COLL_TOKEN_NAME, AMOUNT, BACK_ROUNDS } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.getPrices().argv);

module.exports = async (callback) => {
    try {

        const collTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const amount = processArgs.getValue(AMOUNT.name);

        const getContracts = processArgs.createGetContracts(artifacts);        
        const chainlinkAggregator = await getContracts.getDeployed(teller.chainlinkAggregator());
        const sourceToken = tokenName.toUpperCase() === 'ETH' ?  {address: ETH_ADDRESS, decimals: async () => Promise.resolve(18) }: await getContracts.getDeployed(tokens.get(tokenName));
        const targetToken = collTokenName.toUpperCase() === 'ETH' ?  {address: ETH_ADDRESS, decimals: async () => Promise.resolve(18) }: await getContracts.getDeployed(tokens.get(collTokenName));

        const decimals = await sourceToken.decimals()
        const amountWithDecimals = toDecimals(amount, decimals.toString()).toFixed(0);

        const targetTokenDecimals = await targetToken.decimals();
        
        console.log(`Chainlink Aggregator => ${tokenName} / ${collTokenName}: `);
        console.log(`${'-'.repeat(60)}`);

        const getLatestAnswerResult = await chainlinkAggregator.latestAnswerFor(sourceToken.address, targetToken.address);
        console.log(`Lastest Answer:        1 ${tokenName} = ${getLatestAnswerResult.toString()} = ${toUnits(getLatestAnswerResult.toString(), targetTokenDecimals)} ${collTokenName}`);

        const latestValueResult = await chainlinkAggregator.valueFor(sourceToken.address, targetToken.address, amountWithDecimals);
        console.log(`Lastest Value:         ${amount} ${tokenName} = ${latestValueResult.toString()} = ${toUnits(latestValueResult.toString(), targetTokenDecimals)} ${collTokenName}`);

        console.log(`${'-'.repeat(60)}`);
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
