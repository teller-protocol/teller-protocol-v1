// Smart contracts

// Util classes
const { zerocollateral } = require("../utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const processArgs = new ProcessArgs();

/** Process parameters: */
const tokenName = 'USDC';
const loanID = 1;
const senderIndex = 0;

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(zerocollateral.loans(tokenName));

        const sender = await accounts.getAt(senderIndex);
        const txConfig = { from: sender };

        const result = await loansInstance.liquidateLoan(loanID, txConfig);
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};