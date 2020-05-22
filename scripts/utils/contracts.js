const ZERO_COLLATERAL_KEY = 'zerocollateral';
module.exports = {
    zerocollateral: {
        ZDai_Loans: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'Loans_zusdc',
            artifactName: 'Loans',
        },
        ZUsdc_Loans: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'Loans_zusdc',
            artifactName: 'Loans',
        },
        ZDai: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'ZDAI',
            artifactName: undefined,
        },
        ZUsdc: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'ZUSDC',
            artifactName: undefined,
        },
        Settings: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'Settings',
            artifactName: undefined,
        },
        DaiEth_ChainlinkPairAggregator: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'ChainlinkPairAggregator_DAI_ETH',
            artifactName: 'ChainlinkPairAggregator',
        },
        UsdcEth_ChainlinkPairAggregator: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'ChainlinkPairAggregator_USDC_ETH',
            artifactName: 'ChainlinkPairAggregator',
        },
        ZDai_LendingPool: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'LendingPool_zDAI',
            artifactName: 'LendingPool',
        },
        ZUsdc_LendingPool: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'LendingPool_zUSDC',
            artifactName: 'LendingPool',
        },
        ZDai_InterestConsensus: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'InterestConsensus_zDAI',
            artifactName: 'InterestConsensus',
        },
        ZUsdc_InterestConsensus: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'InterestConsensus_zUSDC',
            artifactName: 'InterestConsensus',
        },
        ZDai_Lenders: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'Lenders_zDAI',
            artifactName: 'Lenders',
        },
        ZUsdc_Lenders: {
            keyName: ZERO_COLLATERAL_KEY,
            contractName: 'Lenders_zUSDC',
            artifactName: 'Lenders',
        },
    },
    tokens: {
        Dai: {
            keyName: 'tokens',
            contractName: 'DAI',
            artifactName: 'ERC20Mock',
        },
        Dai: {
            keyName: 'tokens',
            contractName: 'DAI',
            artifactName: 'ERC20Mock',
        },
    }
};