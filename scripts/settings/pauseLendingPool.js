// Smart contracts

// Util classes
const { teller } = require("../utils/contracts");
const Accounts = require('../utils/Accounts');
const ProcessArgs = require('../utils/ProcessArgs');

const { settings: readParams } = require("../utils/cli-builder");
const { COLL_TOKEN_NAME, TOKEN_NAME, SENDER_INDEX } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.pauseLendingPool().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);

        const getContracts = processArgs.createGetContracts(artifacts);
        const lendingPool = await getContracts.getDeployed(teller.custom(collateralTokenName).lendingPool(tokenName));
        const settings = await getContracts.getDeployed(teller.settings());

        console.log(`LendingPool:   ${lendingPool.address}`);
        console.log(`Market:        ${tokenName} / ${collateralTokenName}`);

        const currentPaused = await settings.lendingPoolPaused(lendingPool.address, senderTxConfig);
        console.log(`LendingPool Paused (Current)?:     ${currentPaused.toString()}`);

        const result = await settings.pauseLendingPool(lendingPool.address, senderTxConfig);
        console.log(toTxUrl(result));

        const updatedPaused = await settings.lendingPoolPaused(lendingPool.address, senderTxConfig);
        console.log(`LendingPool Paused (Updated)?:     ${updatedPaused.toString()}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};