module.exports = {
    network: 'ganache',
    chainlink: require('./chainlink'),
    tokens: require('./tokens'),
    maxGasLimit: 9000000,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
