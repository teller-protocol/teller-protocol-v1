const _ = require('lodash');
const assert = require('assert');

const internalAddSigner = async (label, consensusInstance, signerAddress, senderTxConfig) => {
    console.log(`Adding signer ${signerAddress} to consensus contract ${consensusInstance.address}.`);
    const isAlreadySigner = await consensusInstance.isSigner(signerAddress);
    if (isAlreadySigner === false) {
        await consensusInstance.addSigner(signerAddress);
        const isSigner = await consensusInstance.isSigner(signerAddress);
        console.log(`${label}: Has ${signerAddress} a signer role? ${isSigner.toString()}`);
    } else {
        console.log(`${label}: Account ${signerAddress} is already a signer in contract.`);
    }
}

/**
    This function is used by PoolDeployer to add signer addresses in the consensus contracts once they are already deployed.
    The configuration file is 'signers.js' and it is located in each 'network' folder within the 'config' folder.
 */
module.exports = async function(
    { loanTermsConsensusInstance, interestConsensusInstance },
    { signers, txConfig, },
    { },
) {
    const signerKeys = Object.keys(signers);
    console.log(`Configuring ${signerKeys.length} signer address in consensus contracts.`);
    for (const signerKey of signerKeys) {
        const signerAddress = signers[signerKey];
        assert(!_.isUndefined(signerAddress), `Signer address is undefined for key ${signerKey}.`);

        await internalAddSigner(
            'LoanTermsConsensus',
            loanTermsConsensusInstance,
            signerAddress,
            txConfig,
        );
        await internalAddSigner(
            'InterestConsensus',
            interestConsensusInstance,
            signerAddress,
            txConfig,
        );

    }
}