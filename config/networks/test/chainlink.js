const { DUMMY_ADDRESS } = require('../../consts');

module.exports = {
    USDC_ETH: {
        address: DUMMY_ADDRESS,
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 18,
        baseTokenName: 'USDC',
        quoteTokenName: 'ETH',
    },
    DAI_ETH: {
        address: DUMMY_ADDRESS,
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 18,
        baseTokenName: 'DAI',
        quoteTokenName: 'ETH',
    },
    LINK_DAI: {
        address: DUMMY_ADDRESS,
        inversed: true,
        collateralDecimals: 18, // LINK
        responseDecimals: 8,
        baseTokenName: 'LINK',
        quoteTokenName: 'DAI',
    },
    LINK_USDC: {
        address: DUMMY_ADDRESS,
        inversed: true,
        collateralDecimals: 18, // LINK
        responseDecimals: 8,
        baseTokenName: 'LINK',
        quoteTokenName: 'USDC',
    },
};