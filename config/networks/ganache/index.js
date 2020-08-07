module.exports = {
    network: 'ganache',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    zerocollateral: require('./zerocollateral'),
    assetSettings: require('./assetSettings'),
    nodeComponentsVersions: require('./nodeComponentsVersions'),
    platformSettings: require('./platformSettings'),
    maxGasLimit: 6721975,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
