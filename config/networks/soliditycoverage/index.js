module.exports = {
    network: 'soliditycoverage',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    assetSettings: require('./assetSettings'),
    platformSettings: require('./platformSettings'),
    maxGasLimit: 11500000,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
