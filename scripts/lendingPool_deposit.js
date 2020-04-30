// Smart contracts
const LendingPoolInterface = artifacts.require("./interfaces/LendingPoolInterface.sol");
const ERC20 = artifacts.require("openzeppelin-solidity/contracts/token/ERC20/IERC20.sol");

// Util classes
const BigNumber = require('bignumber.js');
const assert = require('assert');
const ProcessArgs = require('./utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const tokenName = 'USDC';
const senderIndex = 0;
const depositAmount = 300000000;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../config')(network);
        const { zerocollateral, tokens, toTxUrl } = appConf.networkConfig;

        const lendingPoolAddress = zerocollateral[`LendingPool_z${tokenName}`];
        assert(lendingPoolAddress, "LendingPool address is undefined.");
        const tokenAddress = tokens[tokenName];
        assert(tokenAddress, "Token address is undefined.");

        const tokenInstance = await ERC20.at(tokenAddress);
        const lendingPoolInstance = await LendingPoolInterface.at(lendingPoolAddress);

        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const sender = accounts[senderIndex];
        assert(sender, "Sender must be defined.");

        const initialLendingPoolDaiBalance = await tokenInstance.balanceOf(lendingPoolAddress);

        const senderDaiBalance = await tokenInstance.balanceOf(sender);
        assert(BigNumber(senderDaiBalance.toString()).gte(depositAmount), `Not enough ${tokenName} balance.`);

        await tokenInstance.approve(lendingPoolAddress, depositAmount, { from: sender });

        const result = await lendingPoolInstance.deposit(depositAmount, { from: sender });
        console.log(toTxUrl(result));

        const finalLendingPoolDaiBalance = await tokenInstance.balanceOf(lendingPoolAddress);
        console.log('');
        console.log(`Deposit ${tokenName}`);
        console.log('-'.repeat(11));
        console.log(`${tokenName} Amount: ${depositAmount.toString()}`);
        console.log('');
        console.log(`${tokenName} LendingPool`);
        console.log('-'.repeat(8));
        console.log(`Initial ${tokenName} Balance:   ${initialLendingPoolDaiBalance.toString()}`);
        console.log(`Final ${tokenName} Balance:     ${finalLendingPoolDaiBalance.toString()}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};