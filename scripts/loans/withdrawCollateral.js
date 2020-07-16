// Smart contracts

// Util classes
const { zerocollateral } = require("../../scripts/utils/contracts");
const Accounts = require('../utils/Accounts');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */
const tokenName = 'USDC';
const loanId = 1;
const borrowerIndex = 1;
const amount = '300000000';

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(zerocollateral.loans(tokenName));

        const borrower = await accounts.getAt(borrowerIndex);

        console.log(`Loan ID:       ${loanId}`);
        console.log(`Borrower:      ${borrowerIndex} => ${borrower}`);
        console.log(`Amount:        ${amount} WEI`);

        const result = await loansInstance.withdrawCollateral(amount, loanId, { from: borrower });
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};