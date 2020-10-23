// Util classes
const { loans: readParams } = require("../utils/cli-builder");
const { teller, tokens } = require("../utils/contracts");
const { printLoanDetails } = require('../../test/utils/printer')
const tokenActions = require('../utils/actions/tokens')
const ProcessArgs = require('../utils/ProcessArgs');
const { COLL_TOKEN_NAME, TOKEN_NAME, LOAN_ID } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.getLoan().argv);

module.exports = async (callback) => {
    try {
        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const loanId = processArgs.getValue(LOAN_ID.name);
        const getContracts = processArgs.createGetContracts(artifacts);

        const allContracts = await getContracts.getAllDeployed({ teller, tokens }, tokenName, collateralTokenName)
        const { token, collateralToken } = allContracts
        const tokenInfo = await tokenActions.getInfo({ token });
        const collateralTokenInfo = await tokenActions.getInfo({ token: collateralToken });

        const loanIDCounter = await allContracts.loans.loanIDCounter();
        const loanCounter = parseInt(loanIDCounter.toString());

        console.log(`Total # Loans (${tokenName}): ${loanCounter}`);
        console.log('-'.repeat(70));

        await printLoanDetails(
          allContracts,
          { testContext: { artifacts, web3 } },
          { loanId, tokenInfo, collateralTokenInfo }
        )

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
