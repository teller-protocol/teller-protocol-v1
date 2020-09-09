
module.exports = {
    USDC_ETH: {
        address: '0x0482f8aF9A1Bd3078896A3BF970C17A9392c3641',
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 18,
        baseTokenName: 'USDC',
        quoteTokenName: 'ETH',
    },
    DAI_ETH: {
        address: '0x1c52F8372fcf99a0e282A71E4B7d2e1443A8b1f5',
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 18,
        baseTokenName: 'DAI',
        quoteTokenName: 'ETH',
    },
    LINK_DAI: {
        address: '0xE1a250d24cDBA038B7F03197741cc2A9b5F052bD', // Chainlink Pair: LINK - USD
        inversed: true,
        collateralDecimals: 18, // LINK
        responseDecimals: 8,
        baseTokenName: 'LINK',
        quoteTokenName: 'DAI',
    },
    LINK_USDC: {
        address: '0x7D6036e123cDC64A33D5e8a43b4440B67124d53c',  // Chainlink Pair: LINK - USD
        inversed: true,
        collateralDecimals: 18, // LINK
        responseDecimals: 8,
        baseTokenName: 'LINK',
        quoteTokenName: 'USDC',
    },
};