const ZERO_COLLATERAL_KEY = 'zerocollateral';
module.exports = {
    zerocollateral: {
        loans: (tokenName, artifactName = 'Loans') => {
            return {
                keyName: ZERO_COLLATERAL_KEY,
                contractName: `Loans_z${tokenName.toUpperCase()}`,
                artifactName,
            }
        },
        ztoken: (tokenName) => {
            return {
                keyName: ZERO_COLLATERAL_KEY,
                contractName: `Z${tokenName.toUpperCase()}`,
                artifactName: undefined,
            };
        },
        oracle: (tokenName, artifactName = 'ChainlinkPairAggregator') => {
            return {
                keyName: ZERO_COLLATERAL_KEY,
                contractName: `ChainlinkPairAggregator_${tokenName.toUpperCase()}_ETH`,
                artifactName,
            };
        },
        lendingPool: (tokenName, artifactName = 'LendingPool') => {
            return {
                keyName: ZERO_COLLATERAL_KEY,
                contractName: `LendingPool_z${tokenName.toUpperCase()}`,
                artifactName,
            };
        },
        interestConsensus: (tokenName, artifactName = 'InterestConsensus') => {
            return {
                keyName: ZERO_COLLATERAL_KEY,
                contractName: `InterestConsensus_z${tokenName.toUpperCase()}`,
                artifactName,
            };
        },
        loanTermsConsensus: (tokenName, artifactName = 'LoanTermsConsensus') => {
            return {
                keyName: ZERO_COLLATERAL_KEY,
                contractName: `LoanTermsConsensus_z${tokenName.toUpperCase()}`,
                artifactName,
            };
        },
        lenders: (tokenName, artifactName = 'Lenders') => {
            return {
                keyName: ZERO_COLLATERAL_KEY,
                contractName: `Lenders_z${tokenName.toUpperCase()}`,
                artifactName,
            };
        },
        settings: () => {
            return {
                keyName: ZERO_COLLATERAL_KEY,
                contractName: 'Settings',
                artifactName: undefined,
            };
        }
    },
    tokens: {
        get: (tokenName, artifactName = 'ERC20Mock') => {
            return {
                keyName: 'tokens',
                contractName: tokenName.toUpperCase(),
                artifactName,
            };
        },
    },
    chainlink: {
        get: (tokenName, artifactName = 'PairAggregatorMock') => {
            return {
                keyName: 'chainlink',
                contractName: `${tokenName.toUpperCase()}_ETH`,
                artifactName,
            };
        },
    }
};