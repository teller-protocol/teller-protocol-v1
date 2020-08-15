// Smart contracts

// Util classes
const { loans: readParams } = require("../utils/cli-builder");
const { teller } = require("../utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const processArgs = new ProcessArgs(readParams.liquidate().argv);

module.exports = async (callback) => {
    try {
        const tokenName = processArgs.getValue('tokenName');
        const loanId = processArgs.getValue('loanId');
        const senderIndex = processArgs.getValue('senderIndex');
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(teller.loans(tokenName));

        const sender = await accounts.getAt(senderIndex);
        const txConfig = { from: sender };

        const result = await loansInstance.liquidateLoan(loanId, txConfig);
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};