const { DUMMY_ADDRESS } = require('../../consts');

module.exports = {
    USDC_ETH: {
        address: DUMMY_ADDRESS,
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 18,
    },
    DAI_ETH: {
        address: DUMMY_ADDRESS,
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 18,
    },
    LINK_USD: {
        address: DUMMY_ADDRESS,
        inversed: true,
        collateralDecimals: 18, // LINK
        responseDecimals: 8,
    },
};