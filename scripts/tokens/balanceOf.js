// Smart contracts

// Util classes
const { tokens: readParams } = require("../utils/cli-builder");
const { tokens } = require("../utils/contracts");
const Accounts = require('../utils/Accounts');
const ProcessArgs = require('../utils/ProcessArgs');
const { toUnits } = require("../../test/utils/consts");
const { TOKEN_NAME, ACCOUNT_INDEX } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.mint().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const getContracts = processArgs.createGetContracts(artifacts);

        const accountIndex = processArgs.getValue(ACCOUNT_INDEX.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);

        const account = await accounts.getAt(accountIndex);
        
        const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const tokenDecimals = await tokenInstance.decimals();
        
        const accountBalanceWithDecimals = await tokenInstance.balanceOf(account);
        
        const accountBalance = toUnits(accountBalanceWithDecimals, tokenDecimals.toString()).toFixed(0);

        console.log(`Token / Address:           ${tokenName} / ${tokenInstance.address}`);
        console.log(`Account Index / Address:   ${accountIndex} / ${account}`);
        console.log(`Balance:                   ${accountBalanceWithDecimals.toString()} = ${accountBalance.toString()} ${tokenName}`)

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
