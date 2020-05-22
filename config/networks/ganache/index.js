module.exports = {
    network: 'ganache',
    chainlink: require('./chainlink'),
    tokens: require('./tokens'),
    zerocollateral: require('./zerocollateral'),
    maxGasLimit: 6721975,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
