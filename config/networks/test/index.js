module.exports = {
    network: 'test',
    chainlink: require('./chainlink'),
    tokens: require('./tokens'),
    maxGasLimit: 6000000,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
