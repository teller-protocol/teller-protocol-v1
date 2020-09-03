
/**
    This function adds signer addresses in the consensus contracts once they are already deployed.
    The configuration file is 'signers.js' and it is located in each 'network' folder within the 'config' folder.
 */
module.exports = async function(
    { loanTermsConsensusInstance, interestConsensusInstance },
    { signers, txConfig, },
    { },
) {
    const signerAddresses = Object.values(signers);

    if(signerAddresses.length === 0) {
        console.log('Consensus: not new signers defined.');
        return;
    }
    console.log('');
    console.log(`New addresses (${signerAddresses.length}) to add as signers: ${signerAddresses}.`);
    console.log(`LoanTermsConsensus (${loanTermsConsensusInstance.address}): adding ${signerAddresses.length} accounts as signers.`);
    await loanTermsConsensusInstance.addSigners(signerAddresses, txConfig);
    console.log(`InteresstConsensus (${interestConsensusInstance.address}): adding ${signerAddresses.length} accounts as signers.`);
    await interestConsensusInstance.addSigners(signerAddresses, txConfig);
}