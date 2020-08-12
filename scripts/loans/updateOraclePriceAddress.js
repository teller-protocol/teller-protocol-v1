// Smart contracts

// Util classes
const assert = require('assert');
const { teller } = require("../utils/contracts");
const { loans: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const { COLL_TOKEN_NAME, TOKEN_NAME, SENDER_INDEX, NEW_VALUE } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.updateOraclePriceAddress().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const newValue = processArgs.getValue(NEW_VALUE.name);
        assert(newValue, 'New oracle address must be defined.');

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(teller.custom(collateralTokenName).loans(tokenName));

        const sender = await accounts.getAt(senderIndex);

        const currentPriceOracleAddress = await loansInstance.priceOracle();

        console.log(`Loans Contract:        ${loansInstance.address}`);
        console.log(`Market:                ${tokenName} / ${collateralTokenName} `);
        console.log(`Current Oracle:        ${currentPriceOracleAddress}`);
        console.log(`New Oracle To apply:   ${newValue}`);

        const result = await loansInstance.setPriceOracle(
            newValue,
            {
                from: sender
            }
        );
        console.log(toTxUrl(result));

        const updatedPriceOracleAddress = await loansInstance.priceOracle();

        console.log(`Loans Contract:        ${loansInstance.address}`);
        console.log(`Market:                ${tokenName} / ${collateralTokenName} `);
        console.log(`Updated Oracle:        ${updatedPriceOracleAddress}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};