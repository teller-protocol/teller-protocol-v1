module.exports = {
    network: 'rinkeby',
    chainlink: require('./chainlink.json'),
    compound: require('./compound.json'),
    tokens: require('./tokens.json'),
    teller: require('./teller.json'),
    assetSettings: require('./assetSettings.json'),
    platformSettings: require('./platformSettings.json'),
    signers: require('./signers.json'),
    atms: require('./atms.json'),
    nodes: require('./nodes.json'),
    loanTermsSignatureValidatorAddress: '0x56d376DE375377F085d78fF3aA4e5CB587ba1d73',
    maxGasLimit: 6000000,
    toTxUrl: ({ tx }) => {
        return `https://rinkeby.etherscan.io/tx/${tx}`;
    },
};
