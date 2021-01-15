// Smart contracts

// Util classes
const assert = require('assert');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

/** Process parameters: */

module.exports = async (callback) => {
  try {
    const network = processArgs.network();
    console.log(`Script will be executed in network ${network}.`);
    const accounts = await web3.eth.getAccounts();
    assert(accounts, 'Accounts must be defined.');

    console.log(`Total accounts: ${accounts.length}`);

    for (const accountIndex in accounts) {
      console.log(`${accountIndex} = ${accounts[accountIndex]}`);
    }

    console.log('>>>> The script finished successfully. <<<<');
    callback();
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
