// Smart contracts
const LoansInterface = artifacts.require("./base/Loans.sol");
const ERC20 = artifacts.require("openzeppelin-solidity/contracts/token/ERC20/IERC20.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const loanID = 1;
const repayAmount = 100;
const senderIndex = 1;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../../config')(network);
        const { zerocollateral, tokens, toTxUrl } = appConf.networkConfig;

        assert(zerocollateral.Loans_zDAI, "Loans_zDAI address is undefined.");
        assert(tokens.DAI, "DAI address is undefined.");
        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const sender = accounts[senderIndex];
        assert(sender, "Sender must be defined.");

        const txConfig = { from: sender };

        const loansInstance = await LoansInterface.at(zerocollateral.Loans_zDAI);

        const lendingPoolnAddress = await loansInstance.lendingPool();
        const lendingTokenAddress = tokens.DAI;
        const lendingTokenInstance = await ERC20.at(lendingTokenAddress);

        await lendingTokenInstance.approve(lendingPoolnAddress, repayAmount.toString(), txConfig);
        const result = await loansInstance.repay(
            repayAmount,
            loanID,
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