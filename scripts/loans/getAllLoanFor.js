// Smart contracts

// Util classes
const { teller } = require('../../scripts/utils/contracts');
const { loans: readParams } = require('../utils/cli-builder');
const ProcessArgs = require('../utils/ProcessArgs');
const { COLL_TOKEN_NAME, TOKEN_NAME, BORROWER } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.getAllLoansFor().argv);

module.exports = async (callback) => {
  try {
    const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
    const tokenName = processArgs.getValue(TOKEN_NAME.name);
    const borroweAddress = processArgs.getValue(BORROWER.name);
    const getContracts = processArgs.createGetContracts(artifacts);
    const loansInstance = await getContracts.getDeployed(
      teller.custom(collateralTokenName).loans(tokenName)
    );

    const loanIds = await loansInstance.getBorrowerLoans(borroweAddress);

    console.log(`Token / Coll. Token:   ${tokenName} / ${collateralTokenName}`);
    console.log(`Borrower:      ${borroweAddress}`);
    console.log(`# Loans:       ${loanIds.length}`);
    for (const loanId of loanIds) {
      const lastLoan =
        loanIds.indexOf(loanId) === loanIds.length - 1 ? '<<< Last Loan >>>' : '';
      console.log(`Loan ID: ${loanId} ${lastLoan}`);
    }

    console.log('>>>> The script finished successfully. <<<<');
    callback();
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
