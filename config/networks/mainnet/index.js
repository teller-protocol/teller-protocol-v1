module.exports = {
    network: 'mainnet',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    teller: require('./teller'),
    dao: require('./dao'),
    assetSettings: require('./assetSettings'),
    platformSettings: require('./platformSettings'),
    signers: require('./signers'),
    maxGasLimit: 3500000,
    toTxUrl: ({ tx }) => {
        return `https://www.etherscan.io/tx/${tx}`;
    },
};
