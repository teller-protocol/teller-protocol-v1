module.exports = {
    network: 'rinkeby',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    assetSettings: require('./assetSettings'),
    nodeComponentsVersions: require('./nodeComponentsVersions'),
    maxGasLimit: 7000000,
    toTxUrl: ({ tx }) => {
        return `https://rinkeby.etherscan.io/tx/${tx}`;
    },
};
