// Smart contracts

// Util classes
const BigNumber = require('bignumber.js');
const assert = require('assert');
const { zerocollateral, tokens } = require("../../scripts/utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const processArgs = new ProcessArgs();

/** Process parameters: */
const tokenName = 'USDC';
const loanID = 1;
const loanAmount = 100;
const senderIndex = 1;

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const getContracts = processArgs.createGetContracts(artifacts);
        const lendingTokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const loansInstance = await getContracts.getDeployed(zerocollateral.loans(tokenName));

        const lendingPoolAddress = await loansInstance.lendingPool();
        const lendingPoolTokenBalance = await lendingTokenInstance.balanceOf(lendingPoolAddress);
        assert(BigNumber(lendingPoolTokenBalance.toString()).gte(loanAmount.toString()), "LendingPool: Not enough token balance.");

        const sender = await accounts.getAt(senderIndex);
        const txConfig = { from: sender };

        const result = await loansInstance.takeOutLoan(
            loanID,
            loanAmount,
            txConfig
        );
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};