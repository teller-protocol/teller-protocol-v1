// Smart contracts

// Util classes
const { loans: readParams } = require("../utils/cli-builder");
const { teller, tokens } = require("../utils/contracts");
const ProcessArgs = require("../utils/ProcessArgs");
const tokensActions = require("../../test-integration/utils/actions/tokens");
const { printLoanInfo } = require("../../test-integration/utils/actions/loans");

const { COLL_TOKEN_NAME, TOKEN_NAME, LOAN_ID } = require("../utils/cli/names");
const processArgs = new ProcessArgs(readParams.getLoan().argv);

module.exports = async (callback) => {
  try {
    const testContext = {
      web3,
      artifacts,
      verbose: true
    }

    const collTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
    const tokenName = processArgs.getValue(TOKEN_NAME.name);
    const loanId = processArgs.getValue(LOAN_ID.name);
    const getContracts = processArgs.createGetContracts(artifacts);

    const allContracts = await getContracts.getAllDeployed(
      { teller, tokens },
      tokenName,
      collTokenName
    );

    const tokenInfo = await tokensActions.getInfo({ token: allContracts.token });
    const collateralTokenInfo = await tokensActions.getInfo({ token: allContracts.collateralToken });

    await printLoanInfo(
      allContracts,
      { testContext },
      { tokenInfo, collateralTokenInfo, loanId }
    )

    console.log(">>>> The script finished successfully. <<<<");
    callback();
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
