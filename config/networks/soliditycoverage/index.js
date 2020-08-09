module.exports = {
    network: 'soliditycoverage',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    assetSettings: require('./assetSettings'),
    nodeComponentsVersions: require('./nodeComponentsVersions'),
    platformSettings: require('./platformSettings'),
    maxGasLimit: 11500000,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
