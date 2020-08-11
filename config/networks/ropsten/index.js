module.exports = {
    network: 'ropsten',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    dao: require('./dao'),
    tokens: require('./tokens'),
    zerocollateral: require('./zerocollateral'),
    assetSettings: require('./assetSettings'),
    platformSettings: require('./platformSettings'),
    maxGasLimit: 7000000,
    toTxUrl: ({ tx }) => {
        return `https://ropsten.etherscan.io/tx/${tx}`;
    },
};
