// Smart contracts

// Util classes
const { teller, tokens } = require("../utils/contracts");
const { lendingPool: readParams } = require("../utils/cli-builder");
const { toUnits } = require("../../test/utils/consts");
const ProcessArgs = require('../utils/ProcessArgs');
const { TOKEN_NAME, COLL_TOKEN_NAME } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.balance().argv);

module.exports = async (callback) => {
    try {
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const collTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const getContracts = processArgs.createGetContracts(artifacts);
        const lendingPoolInstance = await getContracts.getDeployed(teller.custom(collTokenName).lendingPool(tokenName));
        const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));

        const lendingPoolDaiBalance = await tokenInstance.balanceOf(lendingPoolInstance.address);
        const decimals = await tokenInstance.decimals();

        console.log('');
        console.log(`Lending Pool ${tokenName}`);
        console.log('-'.repeat(11));
        console.log(`Balance: ${lendingPoolDaiBalance.toString()} = ${toUnits(lendingPoolDaiBalance.toString(), decimals)} ${tokenName}`);
        console.log('');
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};