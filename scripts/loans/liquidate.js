const BN = require('bignumber.js')

// Util classes
const { loans: readParams } = require("../utils/cli-builder");
const { teller, tokens } = require("../utils/contracts");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const processArgs = new ProcessArgs(readParams.liquidate().argv);

module.exports = async (callback) => {
    try {
        const tokenName = processArgs.getValue('tokenName');
        const collTokenName = processArgs.getValue('collTokenName');
        const loanId = processArgs.getValue('loanId');
        const senderIndex = processArgs.getValue('senderIndex');
        const accounts = new Accounts(web3);
        const getContracts = processArgs.createGetContracts(artifacts);

        const loansInstance = await getContracts.getDeployed(teller.custom(collTokenName).loans(tokenName));
        const { liquidable, amountToLiquidate } = await loansInstance.getLiquidationInfo(loanId)
        if (!liquidable) {
            console.log()
            console.error('================================')
            console.error(`Loan #${loanId} is not liquidable.`)
            console.error('================================')
            console.log()
        } else {
            const sender = await accounts.getAt(senderIndex);
            const txConfig = { from: sender };

            const lendingPool = await getContracts.getDeployed(teller.custom(collTokenName).lendingPool(tokenName));
            const token = await getContracts.getDeployed(tokens.get(tokenName));
            const allowance = new BN(await token.allowance(sender, lendingPool.address))
            if (allowance.lt(amountToLiquidate)) {
                await token.approve(lendingPool.address, amountToLiquidate, txConfig)
            }

            const result = await loansInstance.liquidateLoan(loanId, txConfig);
            const { toTxUrl } = processArgs.getCurrentConfig().networkConfig;
            console.log(toTxUrl(result));
        }

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
