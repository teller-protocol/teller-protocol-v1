module.exports = {
    network: 'ganache',
    chainlink: require('./chainlink.json'),
    compound: require('./compound.json'),
    tokens: require('./tokens.json'),
    teller: require('./teller.json'),
    assetSettings: require('./assetSettings.json'),
    platformSettings: require('./platformSettings.json'),
    signers: require('./signers.json'),
    atms: require('./atms.json'),
    maxGasLimit: 6721975,
    toTxUrl: ({ tx }) => {
        return `not-supported-url`;
    },
};
