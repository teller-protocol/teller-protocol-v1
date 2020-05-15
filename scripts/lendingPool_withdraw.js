// Smart contracts
const LendingPoolInterface = artifacts.require("./interfaces/LendingPoolInterface.sol");
const ERC20 = artifacts.require("openzeppelin-solidity/contracts/token/ERC20/IERC20.sol");

// Util classes
const assert = require('assert');
const ProcessArgs = require('./utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const tokenName = 'DAI';
const senderIndex = 0;
const withdrawAmount = 20;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../config')(network);
        const { zerocollateral, tokens, toTxUrl } = appConf.networkConfig;

        const lendingPoolAddress = zerocollateral[`LendingPool_Z${tokenName}`];
        assert(lendingPoolAddress, "LendingPool address is undefined.");
        const tokenAddress = tokens[tokenName];
        assert(tokenAddress, "Token address is undefined.");

        const daiInstance = await ERC20.at(tokenAddress);
        const lendingPoolInstance = await LendingPoolInterface.at(lendingPoolAddress);
        
        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const sender = accounts[senderIndex];
        assert(sender, "Sender must be defined.");

        const initialSenderDaiBalance = await daiInstance.balanceOf(sender);

        const result = await lendingPoolInstance.withdraw(withdrawAmount, { from: sender });
        console.log(toTxUrl(result));

        const finalSenderDaiBalance = await daiInstance.balanceOf(sender);
        console.log('');
        console.log(`Withdraw ${tokenName}`);
        console.log('-'.repeat(11));
        console.log(`${tokenName} Amount: ${withdrawAmount.toString()}`);
        console.log('');
        console.log(`Sender`);
        console.log('-'.repeat(8));
        console.log(`Initial ${tokenName} Balance:   ${initialSenderDaiBalance.toString()}`);
        console.log(`Final ${tokenName} Balance:     ${finalSenderDaiBalance.toString()}`);
        
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
