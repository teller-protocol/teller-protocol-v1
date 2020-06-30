// Smart contracts

// Util classes
const { zerocollateral, tokens } = require("../../scripts/utils/contracts");
const { loans: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const { toDecimals } = require('../../test/utils/consts');
const processArgs = new ProcessArgs(readParams.repay().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue('collTokenName');
        const tokenName = processArgs.getValue('tokenName');
        const senderIndex = processArgs.getValue('senderIndex');
        const loanID = processArgs.getValue('loanId');
        const repayAmount = processArgs.getValue('amount');

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(zerocollateral.custom(collateralTokenName).loans(tokenName));
        const lendingTokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const lendingTokenDecimals = await lendingTokenInstance.decimals();

        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);
        const repayAmountWithDecimals = toDecimals(repayAmount, lendingTokenDecimals);

        const lendingPoolAddress = await loansInstance.lendingPool();

        await lendingTokenInstance.approve(lendingPoolAddress, repayAmountWithDecimals.toString(), senderTxConfig);
        const result = await loansInstance.repay(
            repayAmountWithDecimals,
            loanID,
            senderTxConfig
        );
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};