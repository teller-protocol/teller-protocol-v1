module.exports = {
    network: 'ganache-mainnet',
    chainlink: require('./chainlink'),
    compound: require('./compound'),
    tokens: require('./tokens'),
    teller: require('./teller.json'),
    assetSettings: require('./assetSettings'),
    platformSettings: require('./platformSettings'),
    signers: require('./signers'),
    atms: require('./atms'),
    maxGasLimit: 6000000,
    toTxUrl: ({ tx }) => {
        return `https://www.etherscan.io/tx/${tx}`;
    },
};
