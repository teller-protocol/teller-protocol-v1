// Smart contracts

// Util classes
const { zerocollateral } = require("../../scripts/utils/contracts");
const { loans: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs(readParams.getAllLoansFor().argv);

module.exports = async (callback) => {
    try {
        const collateralTokenName = processArgs.getValue('collTokenName');
        const tokenName = processArgs.getValue('tokenName');
        const borroweAddress = processArgs.getValue('borrower');
        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(zerocollateral.custom(collateralTokenName).loans(tokenName));
        
        const loanIds = await loansInstance.getBorrowerLoans(borroweAddress);
        
        console.log(`Token / Coll. Token:   ${tokenName} / ${collateralTokenName}`);
        console.log(`Borrower:      ${borroweAddress}`);
        console.log(`# Loans:       ${loanIds.length}`);
        for (const loanId of loanIds) {
            const lastLoan = loanIds.indexOf(loanId) === loanIds.length - 1 ? '<<< Last Loan >>>' : '';
            console.log(`Loan ID: ${loanId} ${lastLoan}`);
        }
        
        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
