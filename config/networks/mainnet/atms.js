module.exports = {
    teller: {
        name: 'Teller',
        token: {
            name: 'ATM Token Test',
            symbol: 'ATMTest',
            decimals: 18,
            maxCap: 100000000,
            maxVestingsPerWallet: 50,
        },
        supplyToDebt: 5000,
        /**
            It represents the ATM that will be used by each market. So, a market has only one ATM.
         */
        markets: [
            { borrowedToken: 'DAI', collateralToken: 'ETH' },
            // The first deploy to mainnet will be only DAI/ETH and USDC/LINK.
            //{ borrowedToken: 'DAI', collateralToken: 'LINK' },
            //{ borrowedToken: 'USDC', collateralToken: 'ETH' },
            { borrowedToken: 'USDC', collateralToken: 'LINK' },
        ],
    },
};
