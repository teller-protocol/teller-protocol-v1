module.exports = {
    teller: {
        name: 'Teller',
        token: {
            name: 'Teller Token',
            symbol: 'TLR',
            decimals: 18,
            maxCap: 100000000000,
            maxVestingPerWallet: 50,
        },
        tlrInitialReward: 3,
        supplyToDebt: 5000,
        /**
            It represents the ATM that will be used by each market. So, a market has only one ATM.
         */
        // As the token addresses must be contracts, there are not ATMs configured in test and soliditycoverage.
        markets: [],
    },
};
