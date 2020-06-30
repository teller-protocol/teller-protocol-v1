// Smart contracts

// Util classes
const { zerocollateral, tokens } = require("../../scripts/utils/contracts");
const { loans: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const { toDecimals, DEFAULT_DECIMALS } = require('../../test/utils/consts');
const processArgs = new ProcessArgs(readParams.withdrawCollateral().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue('collTokenName');
        const tokenName = processArgs.getValue('tokenName');
        const borrowerIndex = processArgs.getValue('borrowerIndex');
        const loanId = processArgs.getValue('loanId');
        const collateralAmount = processArgs.getValue('amount');

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(zerocollateral.custom(collateralTokenName).loans(tokenName));

        let collateralTokenDecimals = DEFAULT_DECIMALS;
        if (collateralTokenName !== 'ETH') {
            const collateralTokenInstance = await getContracts.getDeployed(tokens.get(collateralTokenName));
            collateralTokenDecimals = await collateralTokenInstance.decimals();
        }
        const collateralAmountWithDecimals = toDecimals(collateralAmount, collateralTokenDecimals.toString()).toFixed(0);

        const borrower = await accounts.getAt(borrowerIndex);

        console.log(`Loan ID:       ${loanId}`);
        console.log(`Borrower:      ${borrowerIndex} => ${borrower}`);
        console.log(`Collateral:    ${collateralAmount} => ${collateralAmountWithDecimals} ${collateralTokenName}`);

        const result = await loansInstance.withdrawCollateral(
            collateralAmountWithDecimals,
            loanId,
            {
                from: borrower,
            }
        );
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};