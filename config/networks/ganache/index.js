module.exports = {
    network: 'ganache',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    teller: require('./teller'),
    assetSettings: require('./assetSettings'),
    platformSettings: require('./platformSettings'),
    signers: require('./signers'),
    atms: require('./atms'),
    maxGasLimit: 6721975,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
