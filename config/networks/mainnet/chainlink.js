// See more details here https://docs.chain.link/docs/price-feeds-migration-august-2020#config
module.exports = {
    USDC_ETH: {
        address: '0x986b5E1e1755e3C2440e960477f25201B0a8bbD4',
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 18,
    },
    DAI_ETH: {
        address: '0x773616E4d11A78F511299002da57A0a94577F1f4',
        inversed: false,
        collateralDecimals: 18, // ETH
        responseDecimals: 18,
    },
    LINK_USD: {
        address: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
        inversed: true,
        collateralDecimals: 18, // ETH
        responseDecimals: 8,
    },
};