// Smart contracts

// Util classes
const LoanTermsSignatureValidator = artifacts.require(
  './mock/util/LoanTermsSignatureValidator.sol'
);
const Accounts = require('../utils/Accounts');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

module.exports = async (callback) => {
  try {
    const accounts = new Accounts(web3);
    const appConf = processArgs.getCurrentConfig();
    const { maxGasLimit } = appConf.networkConfig;
    const sender = await accounts.getAt(0);

    const newInstance = await LoanTermsSignatureValidator.new({
      gas: maxGasLimit,
      from: sender,
    });
    console.log(`LoanTermsSignatureValidator deployed at :${newInstance.address}`);

    console.log('>>>> The script finished successfully. <<<<');
    callback();
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
