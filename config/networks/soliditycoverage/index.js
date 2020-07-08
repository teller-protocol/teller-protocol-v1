module.exports = {
    network: 'soliditycoverage',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    lendingTokenSettings: require('./lendingTokenSettings'),
    maxGasLimit: 11000000,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
