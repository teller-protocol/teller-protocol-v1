module.exports = {
    network: 'rinkeby',
    chainlink: require('./chainlink'),
    maxGasLimit: 7000000,
    toTxUrl: ({ tx }) => {
        return `https://rinkeby.etherscan.io/tx/${tx}`;
    },
};
