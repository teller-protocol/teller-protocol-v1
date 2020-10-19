module.exports = {
    network: 'rinkeby',
    chainlink: require('./chainlink.json'),
    compound: require('./compound.json'),
    tokens: require('./tokens.json'),
    teller: require('./teller.json'),
    assetSettings: require('./assetSettings.json'),
    platformSettings: require('./platformSettings.json'),
    signers: require('./signers.json'),
    atms: require('./atms.json'),
    nodes: require('./nodes.json'),
    signatureValidatorAddress: '0xf59C2EAFc26BeDA4EE9c796Bfc4ACA91Ada550C3',
    maxGasLimit: 6000000,
    toTxUrl: ({ tx }) => {
        return `https://rinkeby.etherscan.io/tx/${tx}`;
    },
};
