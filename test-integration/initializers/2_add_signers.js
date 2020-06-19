// Util classes
const { zerocollateral } = require("../../scripts/utils/contracts");

const internalAddSigners = async (accounts, collateralTokenName, tokenName, { addressToAddFromIndex, addressToAddToIndex }, loanTermsConsensusInstance) => {
  const txConfig = await accounts.getTxConfigAt(0);
  console.log(`Adding signers to loan terms consensus [${tokenName}-${collateralTokenName} / ${loanTermsConsensusInstance.address}] contract`);
  for(let currentIndex = addressToAddFromIndex; currentIndex < addressToAddToIndex; currentIndex++) {
    const addressToAdd = await accounts.getAt(currentIndex);
    const isAlreadySigner = await loanTermsConsensusInstance.isSigner(addressToAdd);
    if (isAlreadySigner === false) {
        await loanTermsConsensusInstance.addSigner(addressToAdd, txConfig);
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
    signerAddresses,
  } = initConfig;

  for (const tokenName of tokenNames) {
    const ethLoanTermsConsensusInstance = await getContracts.getDeployed(zerocollateral.eth().loanTermsConsensus(tokenName));
    await internalAddSigners(accounts, 'ETH', tokenName, { addressToAddFromIndex, addressToAddToIndex }, ethLoanTermsConsensusInstance );

    const linkLoanTermsConsensusInstance = await getContracts.getDeployed(zerocollateral.link().loanTermsConsensus(tokenName));
    await internalAddSigners(accounts, 'LINK', tokenName, { addressToAddFromIndex, addressToAddToIndex }, linkLoanTermsConsensusInstance );
  }
};
