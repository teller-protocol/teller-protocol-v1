module.exports = {
  network: 'test',
  chainlink: require('./chainlink.json'),
  compound: require('./compound.json'),
  tokens: require('./tokens.json'),
  assetSettings: require('./assetSettings.json'),
  platformSettings: require('./platformSettings.json'),
  signers: require('./signers.json'),
  atms: require('./atms.json'),
  maxGasLimit: 6500000,
  toTxUrl: ({ tx }) => {
    return `not-supported-url`
  },
}
