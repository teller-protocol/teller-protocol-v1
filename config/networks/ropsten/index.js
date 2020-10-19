module.exports = {
    network: 'ropsten',
    chainlink: require('./chainlink.json'),
    compound: require('./compound.json'),
    tokens: require('./tokens.json'),
    teller: require('./teller.json'),
    assetSettings: require('./assetSettings.json'),
    platformSettings: require('./platformSettings.json'),
    signers: require('./signers.json'),
    atms: require('./atms.json'),
    nodes: require('./nodes.json'),
    signatureValidatorAddress: '0xdAdE05d1A7CA9c610a41E7C3E916Ed8edECF6Fcf',
    maxGasLimit: 6000000,
    toTxUrl: ({ tx }) => {
        return `https://ropsten.etherscan.io/tx/${tx}`;
    },
};
