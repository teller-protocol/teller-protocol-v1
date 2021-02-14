// Smart contracts

// Util classes
const { teller, tokens } = require("../utils/contracts");
const { printPairAggregator, printLoanDetails } = require('../../test-old/utils/printer')
const { loans: readParams } = require("../utils/cli-builder");
const tokenActions = require('../utils/actions/tokens')
const ProcessArgs = require('../utils/ProcessArgs');
const { COLL_TOKEN_NAME, TOKEN_NAME, INITIAL_LOAN_ID, FINAL_LOAN_ID } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.listLoans().argv);

module.exports = async (callback) => {
    try {
        const getContracts = processArgs.createGetContracts(artifacts);

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const startLoanId = processArgs.getValue(INITIAL_LOAN_ID.name);
        const endLoanId = processArgs.getValue(FINAL_LOAN_ID.name);

        const allContracts = await getContracts.getAllDeployed({ teller, tokens }, tokenName, collateralTokenName)
        const { token, collateralToken } = allContracts
        const tokenInfo = await tokenActions.getInfo({ token });
        const collateralTokenInfo = await tokenActions.getInfo({ token: collateralToken });

        const loanIDCounter = await allContracts.loans.loanIDCounter();
        const loanCounter = parseInt(loanIDCounter.toString());

        console.log(`Total # Loans (${tokenName}): ${loanCounter}`);
        console.log('-'.repeat(70));

        await printPairAggregator(
          { chainlinkAggregator: allContracts.chainlinkAggregator },
          { tokenInfo, collateralTokenInfo }
        )

        console.log('-'.repeat(70));

        let currentLoanId = startLoanId;
        while ( currentLoanId < endLoanId && currentLoanId < loanCounter) {
            await printLoanDetails(
              allContracts,
              { testContext: { artifacts, web3 } },
              { loanId: currentLoanId, tokenInfo, collateralTokenInfo }
            )
            currentLoanId++;
        }

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
