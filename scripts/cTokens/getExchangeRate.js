// Smart contracts

// Util classes
const { cTokens: readParams } = require("../utils/cli-builder");
const { ctokens } = require("../utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const { toUnits, toDecimals } = require("../../test/utils/consts");
const { default: BigNumber } = require("bignumber.js");
const processArgs = new ProcessArgs(readParams().argv);

module.exports = async (callback) => {
    try {
        const cTokenName = processArgs.getValue('cTokenName');
        const getContracts = processArgs.createGetContracts(artifacts);
        const cTokenInstance = await getContracts.getDeployed(ctokens.get(cTokenName));

        console.log(`cToken / Address: ${cTokenName} / ${cTokenInstance.address}`);
        console.log('-'.repeat(70));

        const cTokenDecimals = 8;
        const tokenDecimals = 18;
        const tokenAmount = toDecimals(100, tokenDecimals);
        // https://compound.finance/docs/ctokens#exchange-rate
        const exchangeRateDecimals = 18;
        const diffDecimals = exchangeRateDecimals - cTokenDecimals;
        console.log(`Decimals: ${exchangeRateDecimals.toString()}`);
        const exchangeRateCurrentResult = await cTokenInstance.exchangeRateStored();
        
        console.log(`Exchange Rate: ${exchangeRateCurrentResult.toString()} = ${toUnits(exchangeRateCurrentResult.toString(), exchangeRateDecimals.toString())}`);

        const tokenAmountInCToken = tokenAmount.times(toDecimals(1, diffDecimals)).div(new BigNumber(exchangeRateCurrentResult.toString()));
        console.log(`Token in cToken: ${tokenAmountInCToken.toFixed(4)}`);
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
