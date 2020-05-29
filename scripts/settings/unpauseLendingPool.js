// Smart contracts

// Util classes
const { zerocollateral } = require("../utils/contracts");
const Accounts = require('../utils/Accounts');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const tokenName = 'DAI';
const senderIndex = 0;

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;
        
        const getContracts = processArgs.createGetContracts(artifacts);
        const { address: lendingPoolAddress } = await getContracts.getInfo(zerocollateral.lendingPool(tokenName));
        const settings = await getContracts.getDeployed(zerocollateral.settings());

        const sender = await accounts.getAt(senderIndex);
        const txConfig = { from: sender };

        console.log(`Token / LendingPool Address:   ${tokenName} / ${lendingPoolAddress}`);
        const currentPaused = await settings.lendingPoolPaused(lendingPoolAddress, txConfig);
        console.log(`LendingPool Paused (Current):   ${currentPaused.toString()}`);

        const result = await settings.unpauseLendingPool(lendingPoolAddress, txConfig);
        console.log(toTxUrl(result));

        const updatedPaused = await settings.lendingPoolPaused(lendingPoolAddress, txConfig);
        console.log(`LendingPool Paused (Updated):   ${updatedPaused.toString()}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};