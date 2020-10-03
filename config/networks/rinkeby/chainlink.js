// See more details here: https://docs.chain.link/docs/reference-contracts

module.exports = {
    ETH_USDC: {
        //As Chainlink does NOT support USDC/ETH on Rinkeby, we use the pair ETH/USD: 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        address: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 8,
        baseTokenName: 'ETH',
        quoteTokenName: 'USDC',
    },
    ETH_DAI: {
        //As Chainlink does NOT support DAI/ETH on Rinkeby, we use the pair ETH/USD: 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        address: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 8,
        baseTokenName: 'ETH',
        quoteTokenName: 'DAI',
    },
    LINK_DAI: {
        address: '0xd8bD0a1cB028a31AA859A21A3758685a95dE4623', // Chainlink Pair: LINK - USD
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 8,
        baseTokenName: 'LINK',
        quoteTokenName: 'DAI',
    },
    LINK_USDC: {
        address: '0xd8bD0a1cB028a31AA859A21A3758685a95dE4623', // Chainlink Pair: LINK - USD
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 8,
        baseTokenName: 'LINK',
        quoteTokenName: 'USDC',
    },
};