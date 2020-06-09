// Util classes
const { zerocollateral } = require("../../scripts/utils/contracts");

module.exports = async (initConfig, { accounts, getContracts }) => {
  console.log('Adding signers to loan terms consensus contracts.');
  const txConfig = await accounts.getTxConfigAt(0);
  const {
    tokenNames,
    signerAddresses,
  } = initConfig;

  for (const tokenName of tokenNames) {
    const loanTermsConsensusInstance = await getContracts.getDeployed(zerocollateral.loanTermsConsensus(tokenName));
    console.log(`Adding signers to loan terms consensus [${tokenName} / ${loanTermsConsensusInstance.address}] contract`);
    for (const addressToAdd of signerAddresses) {
      const isAlreadySigner = await loanTermsConsensusInstance.isSigner(addressToAdd);
      if (isAlreadySigner === false) {
        await loanTermsConsensusInstance.addSigner(addressToAdd, txConfig);
        const isSigner = await loanTermsConsensusInstance.isSigner(addressToAdd);
        console.log(`Has ${addressToAdd} a signer role? ${isSigner.toString()}`);
      } else {
        console.log(`Account ${addressToAdd} is already a signer in contract.`);
      }
    }
  }
};
