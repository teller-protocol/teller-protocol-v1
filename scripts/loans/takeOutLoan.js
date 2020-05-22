// Smart contracts
const LoansInterface = artifacts.require("./base/Loans.sol");
const ERC20 = artifacts.require("openzeppelin-solidity/contracts/token/ERC20/IERC20.sol");

// Util classes
const BigNumber = require('bignumber.js');
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const tokenName = 'USDC';
const loanID = 0;
const loanAmount = 1000;
const senderIndex = 1;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../../config')(network);
        const { zerocollateral, tokens, toTxUrl } = appConf.networkConfig;

        const tokenAddress = tokens[tokenName];
        assert(tokenAddress, "Token address is undefined.");
        const loansAddress = zerocollateral[`Loans_z${tokenName}`];
        assert(loansAddress, "Loans address is undefined.");

        const loansInstance = await LoansInterface.at(loansAddress);

        const lendingPoolAddress = await loansInstance.lendingPool();
        const lendingTokenAddress = tokenAddress;
        const lendingTokenInstance = await ERC20.at(lendingTokenAddress);

        const lendingPoolTokenBalance = await lendingTokenInstance.balanceOf(lendingPoolAddress);
        assert(BigNumber(lendingPoolTokenBalance.toString()).gte(loanAmount.toString()), "LendingPool: Not enough token balance.");

        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const sender = accounts[senderIndex];
        assert(sender, "Sender must be defined.");

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