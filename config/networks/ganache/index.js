module.exports = {
    network: 'ganache',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    zerocollateral: require('./zerocollateral'),
    lendingTokenSettings: require('./lendingTokenSettings'),
    maxGasLimit: 6721975,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
