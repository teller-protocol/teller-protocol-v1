

module.exports = () => {
    const settingsMap = new Map();
    settingsMap.set(
        'requiredSubmissions',
        {
            get: async (settings) => (await settings.requiredSubmissions()),
            set: async (settings, newValue, senderTxConfig) => (await settings.setRequiredSubmissions(newValue.toString(), senderTxConfig)),
            name: () => 'RequiredSubmissions',
        }
    );
    settingsMap.set(
        'maximumTolerance',
        {
            get: async (settings) => (await settings.maximumTolerance()),
            set: async (settings, newValue, senderTxConfig) => (await settings.setMaximumTolerance(newValue.toString(), senderTxConfig)),
            name: () => 'MaximumTolerance',
        }
    );
    settingsMap.set(
        'responseExpiryLength',
        {
            get: async (settings) => (await settings.responseExpiryLength()),
            set: async (settings, newValue, senderTxConfig) => (await settings.setResponseExpiryLength(newValue.toString(), senderTxConfig)),
            name: () => 'ResponseExpiryLength',
        }
    );
    settingsMap.set(
        'safetyInterval',
        {
            get: async (settings) => (await settings.safetyInterval()),
            set: async (settings, newValue, senderTxConfig) => (await settings.setSafetyInterval(newValue.toString(), senderTxConfig)),
            name: () => 'SafetyInterval',
        }
    );
    settingsMap.set(
        'termsExpiryTime',
        {
            get: async (settings) => (await settings.termsExpiryTime()),
            set: async (settings, newValue, senderTxConfig) => (await settings.setTermsExpiryTime(newValue.toString(), senderTxConfig)),
            name: () => 'TermsExpiryTime',
        }
    );
    settingsMap.set(
        'liquidateEthPrice',
        {
            get: async (settings) => (await settings.liquidateEthPrice()),
            set: async (settings, newValue, senderTxConfig) => (await settings.setLiquidateEthPrice(newValue.toString(), senderTxConfig)),
            name: () => 'LiquidateEthPrice',
        }
    );
    settingsMap.set(
        'maximumLoanDuration',
        {
            get: async (settings) => (await settings.maximumLoanDuration()),
            set: async (settings, newValue, senderTxConfig) => (await settings.setMaximumLoanDuration(newValue.toString(), senderTxConfig)),
            name: () => 'MaximumLoanDuration',
        }
    );
    settingsMap.set(
        'startingBlockNumber',
        {
            get: async (settings) => (await settings.startingBlockNumber()),
            set: async (settings, newValue, senderTxConfig) => (await settings.setStartingBlockNumber(newValue.toString(), senderTxConfig)),
            name: () => 'StartingBlockNumber',
        }
    );
    return settingsMap;
};