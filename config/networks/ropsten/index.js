module.exports = {
    network: 'ropsten',
    chainlink: require('./chainlink'),
    dao: require('./dao'),
    tokens: require('./tokens'),
    zerocollateral: require('./zerocollateral'),
    maxGasLimit: 7000000,
};
