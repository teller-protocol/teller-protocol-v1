module.exports = {
    network: 'rinkeby',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    zerocollateral: require('./zerocollateral'),
    assetSettings: require('./assetSettings'),
    nodeComponentsVersions: require('./nodeComponentsVersions'),
    platformSettings: require('./platformSettings'),
    maxGasLimit: 7000000,
    toTxUrl: ({ tx }) => {
        return `https://rinkeby.etherscan.io/tx/${tx}`;
    },
};
