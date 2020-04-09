// Smart contracts
const DAIPoolInterface = artifacts.require("./interfaces/DAIPoolInterface.sol");
const ERC20 = artifacts.require("openzeppelin-solidity/contracts/token/ERC20/IERC20.sol");

// Util classes
const BigNumber = require('bignumber.js');
const assert = require('assert');
const ProcessArgs = require('./utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const senderIndex = 0;
const depositAmount = 100;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../config')(network);
        const { zerocollateral, tokens, toTxUrl } = appConf.networkConfig;

        assert(zerocollateral.DAIPool, "DAIPool address is undefined.");
        assert(tokens.DAI, "DAI address is undefined.");

        const daiInstance = await ERC20.at(tokens.DAI);
        const daiPoolInstance = await DAIPoolInterface.at(zerocollateral.DAIPool);
        
        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const sender = accounts[senderIndex];
        assert(sender, "Sender must be defined.");

        const initialDaiPoolDaiBalance = await daiInstance.balanceOf(daiPoolInstance.address);

        const senderDaiBalance = await daiInstance.balanceOf(sender);
        assert(BigNumber(senderDaiBalance.toString()).gte(depositAmount), "Not enough DAI balance.");

        await daiInstance.approve(daiPoolInstance.address, depositAmount, { from: sender });

        await daiInstance.allowance(sender, daiPoolInstance.address);
        const result = await daiPoolInstance.depositDai(depositAmount, { from: sender });
        console.log(toTxUrl(result));

        const finalDaiPoolDaiBalance = await daiInstance.balanceOf(daiPoolInstance.address);
        console.log('');
        console.log(`Deposit DAI`);
        console.log('-'.repeat(11));
        console.log(`DAI Amount: ${depositAmount.toString()}`);
        console.log('');
        console.log(`DAI Pool`);
        console.log('-'.repeat(8));
        console.log(`Initial DAI Balance:   ${initialDaiPoolDaiBalance.toString()}`);
        console.log(`Final DAI Balance:     ${finalDaiPoolDaiBalance.toString()}`);
        
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
