module.exports = {
    network: 'mainnet',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    dao: require('./dao'),
    assetSettings: require('./assetSettings'),
    nodeComponentsVersions: require('./nodeComponentsVersions'),

    maxGasLimit: 3500000,
    toTxUrl: ({ tx }) => {
        return `https://www.etherscan.io/tx/${tx}`;
    },
};
