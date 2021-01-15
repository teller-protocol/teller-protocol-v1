// Smart contracts

// Util classes
const { tokens: readParams } = require('../utils/cli-builder');
const { tokens } = require('../utils/contracts');
const Accounts = require('../utils/Accounts');
const ProcessArgs = require('../utils/ProcessArgs');
const { toUnits, toDecimals } = require('../../test/utils/consts');
const { RECEIVER_INDEX, TOKEN_NAME, AMOUNT } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.mint().argv);

module.exports = async (callback) => {
  try {
    const accounts = new Accounts(web3);
    const getContracts = processArgs.createGetContracts(artifacts);
    const appConf = processArgs.getCurrentConfig();
    const { toTxUrl } = appConf.networkConfig;

    const receiverIndex = processArgs.getValue(RECEIVER_INDEX.name);
    const tokenName = processArgs.getValue(TOKEN_NAME.name);
    const amount = processArgs.getValue(AMOUNT.name);

    const receiver = await accounts.getAt(receiverIndex);

    const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
    const tokenDecimals = await tokenInstance.decimals();
    const amountWithDecimals = toDecimals(amount, tokenDecimals.toString()).toFixed(0);

    const initialReceiverBalance = await tokenInstance.balanceOf(receiver);

    console.log(`Token / Address: ${tokenName} / ${tokenInstance.address}`);
    console.log(`Receiver Index / Address: ${receiverIndex} / ${receiver}`);

    console.log('-'.repeat(70));

    const result = await tokenInstance.mint(receiver, amountWithDecimals);

    const finalReceiverBalance = await tokenInstance.balanceOf(receiver);

    console.log(`Token Balance: `);
    console.log(
      `Initial:   ${initialReceiverBalance.toString()} = ${toUnits(
        initialReceiverBalance.toString(),
        tokenDecimals.toString()
      )}`
    );
    console.log(
      `Final:     ${finalReceiverBalance.toString()} = ${toUnits(
        finalReceiverBalance.toString(),
        tokenDecimals.toString()
      )}`
    );

    console.log(toTxUrl(result));
    console.log('>>>> The script finished successfully. <<<<');
    callback();
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
