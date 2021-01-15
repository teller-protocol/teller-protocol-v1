// Smart contracts

// Util classes
const { teller, tokens } = require('../../scripts/utils/contracts');
const { loans: readParams } = require('../utils/cli-builder');
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const { toDecimals } = require('../../test/utils/consts');
const {
  COLL_TOKEN_NAME,
  SENDER_INDEX,
  TOKEN_NAME,
  LOAN_ID,
  AMOUNT,
} = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.repay().argv);

module.exports = async (callback) => {
  try {
    const accounts = new Accounts(web3);
    const appConf = processArgs.getCurrentConfig();
    const { toTxUrl } = appConf.networkConfig;

    const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
    const tokenName = processArgs.getValue(TOKEN_NAME.name);
    const senderIndex = processArgs.getValue(SENDER_INDEX.name);
    const loanID = processArgs.getValue(LOAN_ID.name);
    const repayAmount = processArgs.getValue(AMOUNT.name);

    const getContracts = processArgs.createGetContracts(artifacts);
    const loansInstance = await getContracts.getDeployed(
      teller.custom(collateralTokenName).loans(tokenName)
    );
    const lendingTokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
    const lendingTokenDecimals = await lendingTokenInstance.decimals();

    const senderTxConfig = await accounts.getTxConfigAt(senderIndex);
    const repayAmountWithDecimals = toDecimals(repayAmount, lendingTokenDecimals);

    const lendingPoolAddress = await loansInstance.lendingPool();

    await lendingTokenInstance.approve(
      lendingPoolAddress,
      repayAmountWithDecimals.toString(),
      senderTxConfig
    );
    const result = await loansInstance.repay(
      repayAmountWithDecimals,
      loanID,
      senderTxConfig
    );
    console.log(toTxUrl(result));

    console.log('>>>> The script finished successfully. <<<<');
    callback();
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
