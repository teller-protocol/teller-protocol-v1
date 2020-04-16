module.exports = {
    network: 'mainnet',
    chainlink: require('./chainlink'),
    dao: require('./dao'),
    maxGasLimit: 3500000,
    toTxUrl: ({ tx }) => {
        return `https://www.etherscan.io/tx/${tx}`;
    },
};
