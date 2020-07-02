module.exports = {
    network: 'mainnet',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    dao: require('./dao'),
    maxLendingAmounts: require('./maxLendingAmounts'),
    maxGasLimit: 3500000,
    toTxUrl: ({ tx }) => {
        return `https://www.etherscan.io/tx/${tx}`;
    },
};
