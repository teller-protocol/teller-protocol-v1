module.exports = {
    network: 'mainnet',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    dao: require('./dao'),
    maxGasLimit: 3500000,
    toTxUrl: ({ tx }) => {
        return `https://www.etherscan.io/tx/${tx}`;
    },
};
