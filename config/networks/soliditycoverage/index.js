module.exports = {
    network: 'soliditycoverage',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    maxGasLimit: 9000000,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
