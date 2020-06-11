module.exports = {
    network: 'soliditycoverage',
    chainlink: require('./chainlink'),
    tokens: require('./tokens'),
    maxGasLimit: 10000000,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
