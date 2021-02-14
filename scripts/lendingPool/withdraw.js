// Smart contracts

// Util classes
const {teller, tokens, ctokens} = require("../utils/contracts");
const { toTokenDecimals } = require("../../test-old/utils/consts");
const { lendingPool: readParams } = require("../utils/cli-builder");
const BigNumber = require('bignumber.js');
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const { COLL_TOKEN_NAME, TOKEN_NAME, SENDER_INDEX, AMOUNT } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.withdraw().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const getContracts = processArgs.createGetContracts(artifacts);
        
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const depositAmount = processArgs.getValue(AMOUNT.name);

        const lendingPoolInstance = await getContracts.getDeployed(teller.custom(collateralTokenName).lendingPool(tokenName));
        const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const cTokenInstance = await getContracts.getDeployed(ctokens.fromTokenName(tokenName));
        const withdrawAmountWithDecimals = await toTokenDecimals(tokenInstance, depositAmount);

        const sender = await accounts.getAt(senderIndex);

        const initialLendingPoolCTokenBalance = await cTokenInstance.balanceOf(lendingPoolInstance.address);
        const initialLendingPoolTokenBalance = await tokenInstance.balanceOf(lendingPoolInstance.address);
        const senderTokenBalance = await tokenInstance.balanceOf(sender);
        assert(BigNumber(senderTokenBalance.toString()).gte(withdrawAmountWithDecimals), `Not enough ${tokenName} balance.`);

        await tokenInstance.approve(lendingPoolInstance.address, withdrawAmountWithDecimals, { from: sender });

        const result = await lendingPoolInstance.withdraw(withdrawAmountWithDecimals, { from: sender });
        console.log(toTxUrl(result));

        const finalLendingPoolTokenBalance = await tokenInstance.balanceOf(lendingPoolInstance.address);
        const finalLendingPoolCTokenBalance = await cTokenInstance.balanceOf(lendingPoolInstance.address);
        console.log('');
        console.log(`Withdraw ${tokenName}`);
        console.log('-'.repeat(11));
        console.log(`${tokenName} Amount: ${depositAmount.toString()} = ${withdrawAmountWithDecimals.toString()}`);
        console.log('');
        console.log(`${tokenName} LendingPool`);
        console.log('-'.repeat(30));
        console.log(`Initial ${tokenName} Balance:   ${initialLendingPoolTokenBalance.toString()}`);
        console.log(`Final ${tokenName} Balance:     ${finalLendingPoolTokenBalance.toString()}`);
        console.log('-'.repeat(30));
        console.log(`C${tokenName} LendingPool`);
        console.log('-'.repeat(30));
        console.log(`Initial C${tokenName} Balance:   ${initialLendingPoolCTokenBalance.toString()}`);
        console.log(`Final C${tokenName} Balance:     ${finalLendingPoolCTokenBalance.toString()}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
