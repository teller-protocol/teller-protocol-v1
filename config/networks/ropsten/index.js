module.exports = {
    network: 'ropsten',
    chainlink: require('./chainlink.json'),
    compound: require('./compound.json'),
    tokens: require('./tokens.json'),
    teller: require('./teller.json'),
    assetSettings: require('./assetSettings.json'),
    platformSettings: require('./platformSettings.json'),
    signers: require('./signers.json'),
    atms: require('./atms.json'),
    nodes: require('./nodes.json'),
    loanTermsSignatureValidatorAddress: '0x7301776E7ab81d83187C7dF2972CA8d2C76c7e7c',
    maxGasLimit: 6000000,
    toTxUrl: ({ tx }) => {
        return `https://ropsten.etherscan.io/tx/${tx}`;
    },
};
