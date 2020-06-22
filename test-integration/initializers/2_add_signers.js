// Util classes
const { zerocollateral } = require("../../scripts/utils/contracts");

const internalAddSigners = async (senderTxConfig, accountAddresses, collateralTokenName, tokenName, loanTermsConsensusInstance) => {
  console.log(`Adding signers to loan terms consensus [${tokenName}-${collateralTokenName} / ${loanTermsConsensusInstance.address}] contract`);
  for (const addressToAdd of accountAddresses) {
    const isAlreadySigner = await loanTermsConsensusInstance.isSigner(addressToAdd);
    if (isAlreadySigner === false) {
      await loanTermsConsensusInstance.addSigner(addressToAdd, senderTxConfig);
      const isSigner = await loanTermsConsensusInstance.isSigner(addressToAdd);
      console.log(`Has ${addressToAdd} a signer role? ${isSigner.toString()}`);
    } else {
      console.log(`Account ${addressToAdd} is already a signer in contract.`);
    }
  }
};

module.exports = async (initConfig, { accounts, getContracts }) => {
  console.log('Adding signers to loan terms consensus contracts.');
  const {
    tokenNames,
    signerAddresses = [],
  } = initConfig;
  const senderTxConfig = await accounts.getTxConfigAt(0);

  for (const tokenName of tokenNames) {
    const ethLoanTermsConsensusInstance = await getContracts.getDeployed(zerocollateral.eth().loanTermsConsensus(tokenName));
    await internalAddSigners(senderTxConfig, signerAddresses, 'ETH', tokenName, ethLoanTermsConsensusInstance );

    const linkLoanTermsConsensusInstance = await getContracts.getDeployed(zerocollateral.link().loanTermsConsensus(tokenName));
    await internalAddSigners(senderTxConfig, signerAddresses, 'LINK', tokenName, linkLoanTermsConsensusInstance );
  }
};
