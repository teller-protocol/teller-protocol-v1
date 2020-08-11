// See more details here: https://docs.chain.link/docs/reference-contracts

module.exports = {
    USDC_ETH: {
        //As Chainlink does NOT support USDC/ETH (as on Ropsten), we use the pair ETH/USD: 0x0bF4e7bf3e1f6D6Dc29AA516A33134985cC3A5aA
        address: '0x0bF4e7bf3e1f6D6Dc29AA516A33134985cC3A5aA',
        inversed: true,
        collateralDecimals: 18, // ETH
        responseDecimals: 8,
    },
    DAI_ETH: {
        //As Chainlink does NOT support DAI/ETH (as on Ropsten), we use the pair ETH/USD: 0x0bF4e7bf3e1f6D6Dc29AA516A33134985cC3A5aA
        address: '0x0bF4e7bf3e1f6D6Dc29AA516A33134985cC3A5aA',
        inversed: true,
        collateralDecimals: 18, // ETH
        responseDecimals: 8,
    },
    LINK_USD: {
        address: '0x0853E36EeAd0eAA08D61E94237168696383869DD',
        inversed: true,
        collateralDecimals: 18, // LINK
        responseDecimals: 8,
    },
};