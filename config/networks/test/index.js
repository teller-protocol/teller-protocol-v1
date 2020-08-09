module.exports = {
    network: 'test',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    assetSettings: require('./assetSettings'),
    nodeComponentsVersions: require('./nodeComponentsVersions'),
    platformSettings: require('./platformSettings'),
    maxGasLimit: 6000000,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
