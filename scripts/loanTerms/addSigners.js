// Smart contracts

// Util classes
const { loanTerms: readParams } = require('../utils/cli-builder');
const { teller } = require('../utils/contracts');
const Accounts = require('../utils/Accounts');
const ProcessArgs = require('../utils/ProcessArgs');
const {
  COLL_TOKEN_NAME,
  TOKEN_NAME,
  SENDER_INDEX,
  ADDRESSES,
} = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.addSigners().argv);

module.exports = async (callback) => {
  try {
    const accounts = new Accounts(web3);
    const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
    const tokenName = processArgs.getValue(TOKEN_NAME.name);
    const senderIndex = processArgs.getValue(SENDER_INDEX.name);
    const addresses = processArgs.getValue(ADDRESSES.name);
    const getContracts = processArgs.createGetContracts(artifacts);
    const appConf = processArgs.getCurrentConfig();
    const { toTxUrl } = appConf.networkConfig;

    const senderTxConfig = await accounts.getTxConfigAt(senderIndex);

    const loanTermsConsensusInstance = await getContracts.getDeployed(
      teller.custom(collateralTokenName).loanTermsConsensus(tokenName)
    );

    for (const address of addresses) {
      const isAlreadySigner = await loanTermsConsensusInstance.isSigner(address);

      if (isAlreadySigner.toString() === 'false') {
        const result = await loanTermsConsensusInstance.addSigner(
          address,
          senderTxConfig
        );
        console.log(toTxUrl(result));

        const isSigner = await loanTermsConsensusInstance.isSigner(address);
        console.log(`Has ${address} a signer role? ${isSigner.toString()}`);
      } else {
        console.log(
          `Address ${address} is already signer in loan terms (${tokenName} / ${collateralTokenName})`
        );
      }
    }
    console.log('>>>> The script finished successfully. <<<<');
    callback();
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
