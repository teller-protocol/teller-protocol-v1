// Smart contracts
const LendingPoolInterface = artifacts.require("./interfaces/LendingPoolInterface.sol");
const ERC20 = artifacts.require("openzeppelin-solidity/contracts/token/ERC20/IERC20.sol");

// Util classes
const BigNumber = require('bignumber.js');
const assert = require('assert');
const ProcessArgs = require('./utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const senderIndex = 0;
const depositAmount = 3000;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../config')(network);
        const { zerocollateral, tokens, toTxUrl } = appConf.networkConfig;

        assert(zerocollateral.LendingPool, "LendingPool address is undefined.");
        assert(tokens.DAI, "DAI address is undefined.");

        const daiInstance = await ERC20.at(tokens.DAI);
        const lendingPoolInstance = await LendingPoolInterface.at(zerocollateral.LendingPool);

        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const sender = accounts[senderIndex];
        assert(sender, "Sender must be defined.");

        const initialLendingPoolDaiBalance = await daiInstance.balanceOf(lendingPoolInstance.address);

        const senderDaiBalance = await daiInstance.balanceOf(sender);
        assert(BigNumber(senderDaiBalance.toString()).gte(depositAmount), "Not enough DAI balance.");

        await daiInstance.approve(lendingPoolInstance.address, depositAmount, { from: sender });

        await daiInstance.allowance(sender, lendingPoolInstance.address);
        const result = await lendingPoolInstance.deposit(depositAmount, { from: sender });
        console.log(toTxUrl(result));

        const finalLendingPoolDaiBalance = await daiInstance.balanceOf(lendingPoolInstance.address);
        console.log('');
        console.log(`Deposit DAI`);
        console.log('-'.repeat(11));
        console.log(`DAI Amount: ${depositAmount.toString()}`);
        console.log('');
        console.log(`DAI LendingPool`);
        console.log('-'.repeat(8));
        console.log(`Initial DAI Balance:   ${initialLendingPoolDaiBalance.toString()}`);
        console.log(`Final DAI Balance:     ${finalLendingPoolDaiBalance.toString()}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};