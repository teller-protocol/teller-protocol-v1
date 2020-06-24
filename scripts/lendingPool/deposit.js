// Smart contracts

// Util classes
const {zerocollateral, tokens} = require("../../scripts/utils/contracts");
const { toTokenDecimals } = require("../../test/utils/consts");
const { lendingPool: readParams } = require("../utils/cli-builder");
const BigNumber = require('bignumber.js');
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const processArgs = new ProcessArgs(readParams.deposit().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const getContracts = processArgs.createGetContracts(artifacts);
        
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue('collTokenName');
        const tokenName = processArgs.getValue('tokenName');
        const senderIndex = processArgs.getValue('senderIndex');
        const depositAmount = processArgs.getValue('amount');

        const lendingPoolInstance = await getContracts.getDeployed(zerocollateral.custom(collateralTokenName).lendingPool(tokenName));
        const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const depositAmountWithDecimals = await toTokenDecimals(tokenInstance, depositAmount);

        const sender = await accounts.getAt(senderIndex);

        const initialLendingPoolDaiBalance = await tokenInstance.balanceOf(lendingPoolInstance.address);
        const senderDaiBalance = await tokenInstance.balanceOf(sender);
        assert(BigNumber(senderDaiBalance.toString()).gte(depositAmountWithDecimals), `Not enough ${tokenName} balance.`);

        await tokenInstance.approve(lendingPoolInstance.address, depositAmountWithDecimals, { from: sender });

        const result = await lendingPoolInstance.deposit(depositAmountWithDecimals, { from: sender });
        console.log(toTxUrl(result));

        const finalLendingPoolDaiBalance = await tokenInstance.balanceOf(lendingPoolInstance.address);
        console.log('');
        console.log(`Deposit ${tokenName}`);
        console.log('-'.repeat(11));
        console.log(`${tokenName} Amount: ${depositAmount.toString()} = ${depositAmountWithDecimals.toString()}`);
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