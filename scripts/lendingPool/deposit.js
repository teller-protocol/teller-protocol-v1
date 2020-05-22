// Smart contracts
// const LendingPoolInterface = artifacts.require("./interfaces/LendingPoolInterface.sol");
// const ERC20 = artifacts.require("openzeppelin-solidity/contracts/token/ERC20/IERC20.sol");

// Util classes
const {zerocollateral, tokens} = require("../../scripts/utils/contracts");
const BigNumber = require('bignumber.js');
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const processArgs = new ProcessArgs();

/** Default Parameters: */
const defaultTokenName = 'USDC';
const defaultSenderIndex = 0;
const defaultDepositAmount = 3000000;

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const tokenName = processArgs.getValue('tokenName', defaultTokenName);
        const senderIndex = processArgs.getValue('senderIndex', defaultSenderIndex);
        const depositAmount = processArgs.getValue('amount', defaultDepositAmount);

        const sender = await accounts.getAt(senderIndex);
        const getContracts = processArgs.createGetContracts(artifacts);
        const lendingPoolInstance = await getContracts.getDeployed(zerocollateral.lendingPool(tokenName));
        const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));

        const initialLendingPoolDaiBalance = await tokenInstance.balanceOf(lendingPoolInstance.address);

        const senderDaiBalance = await tokenInstance.balanceOf(sender);
        assert(BigNumber(senderDaiBalance.toString()).gte(depositAmount), `Not enough ${tokenName} balance.`);

        await tokenInstance.approve(lendingPoolInstance.address, depositAmount, { from: sender });

        const result = await lendingPoolInstance.deposit(depositAmount, { from: sender });
        console.log(toTxUrl(result));

        const finalLendingPoolDaiBalance = await tokenInstance.balanceOf(lendingPoolInstance.address);
        console.log('');
        console.log(`Deposit ${tokenName}`);
        console.log('-'.repeat(11));
        console.log(`${tokenName} Amount: ${defaultDepositAmount.toString()}`);
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