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
const withdrawAmount = 20;

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

        const initialSenderDaiBalance = await daiInstance.balanceOf(sender);

        const result = await daiPoolInstance.withdrawDai(withdrawAmount, { from: sender });
        console.log(toTxUrl(result));

        const finalSenderDaiBalance = await daiInstance.balanceOf(sender);
        console.log('');
        console.log(`Withdraw DAI`);
        console.log('-'.repeat(11));
        console.log(`DAI Amount: ${withdrawAmount.toString()}`);
        console.log('');
        console.log(`Sender`);
        console.log('-'.repeat(8));
        console.log(`Initial DAI Balance:   ${initialSenderDaiBalance.toString()}`);
        console.log(`Final DAI Balance:     ${finalSenderDaiBalance.toString()}`);
        
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
