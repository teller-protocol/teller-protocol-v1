
module.exports = {
    USDC_ETH: {
        address: '0x79e38bBeF8eFcee7Ab3D34768ae5f7913715eb61',
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 18,
        baseTokenName: 'USDC',
        quoteTokenName: 'ETH',
    },
    DAI_ETH: {
        address: '0x253b19ee3f3B96Ee80936290E7C2CD8fd0fBFF22',
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 18,
        baseTokenName: 'DAI',
        quoteTokenName: 'ETH',
    },
    LINK_DAI: {
        address: '0xEB946a92aa082a98D1E64AC318869c217901c238', // Chainlink Pair: LINK - USD
        inversed: false,
        collateralDecimals: 18, // LINK
        responseDecimals: 8,
        baseTokenName: 'LINK',
        quoteTokenName: 'DAI',
    },
    LINK_USDC: {
        address: '0xB813c002bF28ed3ed9184bcc095fC3aa0216b5c9',  // Chainlink Pair: LINK - USD
        inversed: false,
        collateralDecimals: 18, // LINK
        responseDecimals: 8,
        baseTokenName: 'LINK',
        quoteTokenName: 'USDC',
    },
};