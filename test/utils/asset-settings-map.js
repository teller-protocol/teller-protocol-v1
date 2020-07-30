const BigNumber = require('bignumber.js');

module.exports = () => {
    const assetSettingsMap = new Map();
    assetSettingsMap.set(
        'maxLoanAmount',
        {
            get: async (assetSettings, assetAddress) => (await assetSettings.getAssetSettings(assetAddress)),
            set: async (assetSettings, assetAddress, newValue, senderTxConfig) => (await assetSettings.updateMaxLoanAmount(assetAddress, BigNumber(newValue.toString()).toFixed(0), senderTxConfig)),
            name: () => 'MaxLoanAmount',
        }
    );
    assetSettingsMap.set(
        'cTokenAddress',
        {
            get: async (assetSettings, assetAddress) => (await assetSettings.getAssetSettings(assetAddress)),
            set: async (assetSettings, assetAddress, newValue, senderTxConfig) => (await assetSettings.updateCTokenAddress(assetAddress, newValue.toString(), senderTxConfig)),
            name: () => 'CTokenAddress',
        }
    );
    assetSettingsMap.set(
        'riskPremiumInterestRate',
        {
            get: async (assetSettings, assetAddress) => (await assetSettings.getAssetSettings(assetAddress)),
            set: async (assetSettings, assetAddress, newValue, senderTxConfig) => (await assetSettings.updateRiskPremiumInterestRate(assetAddress, newValue.toString(), senderTxConfig)),
            name: () => 'RiskPremiumInterestRate',
        }
    );
    return assetSettingsMap;
};