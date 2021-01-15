const BigNumber = require('bignumber.js');
const { toDecimals } = require('./consts');

module.exports = () => {
  const assetSettingsMap = new Map();
  assetSettingsMap.set('maxLoanAmount', {
    get: async (assetSettings, assetAddress) =>
      await assetSettings.getAssetSettings(assetAddress),
    set: async (assetSettings, assetAddress, newValue, senderTxConfig) =>
      await assetSettings.updateMaxLoanAmount(
        assetAddress,
        BigNumber(newValue.toString()).toFixed(0),
        senderTxConfig
      ),
    calculateNewValue: async ({}, { newValue }, { token }) => {
      const decimals = await token.decimals();
      return toDecimals(newValue.toString(), decimals);
    },
    name: () => 'MaxLoanAmount',
  });
  assetSettingsMap.set('cTokenAddress', {
    get: async (assetSettings, assetAddress) =>
      await assetSettings.getAssetSettings(assetAddress),
    set: async (assetSettings, assetAddress, newValue, senderTxConfig) =>
      await assetSettings.updateCTokenAddress(
        assetAddress,
        newValue.toString(),
        senderTxConfig
      ),
    calculateNewValue: async ({}, { newValue }, {}) => {
      return Promise.resolve(newValue);
    },
    name: () => 'CTokenAddress',
  });
  return assetSettingsMap;
};
