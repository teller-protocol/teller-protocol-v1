module.exports = {
    network: 'soliditycoverage',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    maxGasLimit: 11000000,
    assetSettings: require('./assetSettings'),
    nodeComponentsVersions: require('./nodeComponentsVersions'),

    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
