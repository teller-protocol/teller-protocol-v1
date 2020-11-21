/*
    Useful links:

    - Faucet LINK Token: https://kovan.chain.link/
    - Faucet ETH: https://faucet.kovan.network/

*/
module.exports = {
    network: 'kovan',
    chainlink: require('./chainlink.json'),
    compound: require('./compound.json'),
    tokens: require('./tokens.json'),
    teller: require('./teller.json'),
    assetSettings: require('./assetSettings.json'),
    platformSettings: require('./platformSettings.json'),
    signers: require('./signers.json'),
    atms: require('./atms.json'),
    nodes: require('./nodes.json'),
    loanTermsSignatureValidatorAddress: undefined,
    maxGasLimit: 6000000,
    toTxUrl: ({ tx }) => {
        return `https://kovan.etherscan.io/tx/${tx}`;
    },
};
