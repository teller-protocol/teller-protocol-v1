// Smart contracts

// Util classes
const { teller, tokens } = require("../../scripts/utils/contracts");
const { loans: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const { toDecimals, DEFAULT_DECIMALS } = require('../../test-old/utils/consts');
const { COLL_TOKEN_NAME, TOKEN_NAME, BORROWER_INDEX, LOAN_ID, AMOUNT } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.withdrawCollateral().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const borrowerIndex = processArgs.getValue(BORROWER_INDEX.name);
        const loanId = processArgs.getValue(LOAN_ID.name);
        const collateralAmount = processArgs.getValue(AMOUNT.name);

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(teller.custom(collateralTokenName).loans(tokenName));

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
