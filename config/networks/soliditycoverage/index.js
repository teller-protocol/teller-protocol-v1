module.exports = {
    network: 'soliditycoverage',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    assetSettings: require('./assetSettings'),
    platformSettings: require('./platformSettings'),
    signers: require('./signers'),
    atms: require('./atms'),
    maxGasLimit: 15500000,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
