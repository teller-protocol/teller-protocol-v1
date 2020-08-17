module.exports = {
    network: 'rinkeby',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    teller: require('./teller'),
    assetSettings: require('./assetSettings'),
    platformSettings: require('./platformSettings'),
    signers: require('./signers'),
    atms: require('./atms'),
    maxGasLimit: 6000000,
    toTxUrl: ({ tx }) => {
        return `https://rinkeby.etherscan.io/tx/${tx}`;
    },
};
