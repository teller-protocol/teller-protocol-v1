module.exports = {
    network: 'ropsten',
    chainlink: require('./chainlink'),
    tokens: require('./tokens'),
    zerocollateral: require('./zerocollateral'),
    maxGasLimit: 7000000,
};
