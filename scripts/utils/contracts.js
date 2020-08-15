const TELLER_KEY = 'teller';
const ETH = 'ETH';
const LINK = 'LINK';

const internalLoans = (collateralToken, tokenName, artifactName = 'Loans') => {
    return {
        keyName: TELLER_KEY,
        contractName: `${collateralToken.toUpperCase()}_Loans_t${tokenName.toUpperCase()}_Proxy`,
        artifactName,
    }
};
const internalOracle = (sourceToken, targetToken, artifactName = 'ChainlinkPairAggregator') => {
    return {
        keyName: TELLER_KEY,
        contractName: `ChainlinkPairAggregator_${sourceToken.toUpperCase()}_${targetToken.toUpperCase()}`,
        artifactName,
    };
};
const internalLendingPool = (collateralToken, tokenName, artifactName = 'LendingPool') => {
    return {
        keyName: TELLER_KEY,
        contractName: `${collateralToken.toUpperCase()}_LendingPool_t${tokenName.toUpperCase()}_Proxy`,
        artifactName,
    };
};
const internalInterestConsensus = (collateralToken, tokenName, artifactName = 'InterestConsensus') => {
    return {
        keyName: TELLER_KEY,
        contractName: `${collateralToken.toUpperCase()}_InterestConsensus_t${tokenName.toUpperCase()}_Proxy`,
        artifactName,
    };
};
const internalLoanTermsConsensus = (collateralToken, tokenName, artifactName = 'LoanTermsConsensus') => {
    return {
        keyName: TELLER_KEY,
        contractName: `${collateralToken.toUpperCase()}_LoanTermsConsensus_t${tokenName.toUpperCase()}_Proxy`,
        artifactName,
    };
};
const internalLenders = (collateralToken, tokenName, artifactName = 'Lenders') => {
    return {
        keyName: TELLER_KEY,
        contractName: `${collateralToken.toUpperCase()}_Lenders_t${tokenName.toUpperCase()}_Proxy`,
        artifactName,
    };
};
const ttoken = (tokenName) => {
    return {
        keyName: TELLER_KEY,
        contractName: `T${tokenName.toUpperCase()}`,
        artifactName: undefined,
    };
};
const internalChainlink = (sourceTokenName, targetTokenName, artifactName = 'PairAggregatorMock') => {
    return {
        addressOnProperty: 'address',
        keyName: 'chainlink',
        contractName: `${sourceTokenName.toUpperCase()}_${targetTokenName.toUpperCase()}`,
        artifactName,
    };
};

const customCollateralToken = (collateralToken) => {
    const collToken = collateralToken.toUpperCase();
    const loansArtifactName = collToken === ETH ? 'EtherCollateralLoans' : 'TokenCollateralLoans';
    return {
        loans: (tokenName) => {
            return internalLoans(collToken, tokenName, loansArtifactName);
        },
        lendingPool: (tokenName, artifactName = 'LendingPool') => {
            return internalLendingPool(collToken, tokenName, artifactName);
        },
        interestConsensus: (tokenName, artifactName = 'InterestConsensus') => {
            return internalInterestConsensus(collToken, tokenName, artifactName);
        },
        loanTermsConsensus: (tokenName, artifactName = 'LoanTermsConsensus') => {
            return internalLoanTermsConsensus(collToken, tokenName, artifactName);
        },
        lenders: (tokenName, artifactName = 'Lenders') => {
            return internalLenders(collToken, tokenName, artifactName);
        },
        chainlink: {
            usdc_eth: () => internalChainlink('USDC', collToken),
            dai_eth: () => internalChainlink('DAI', collToken),
            custom: (tokenName) => internalChainlink(tokenName.toUpperCase(), collToken),
        }
    };
}
module.exports = {
    teller: {
        ttoken,
        eth: () => customCollateralToken(ETH),
        link: () => customCollateralToken(LINK),
        custom: (collateralToken) => customCollateralToken(collateralToken),
        oracles: () => ({
            usdc_eth: (artifactName = 'ChainlinkPairAggregator') => internalOracle('USDC', 'ETH', artifactName),
            dai_eth: (artifactName = 'ChainlinkPairAggregator') => internalOracle('DAI', 'ETH', artifactName),
            usdc_link: (artifactName = 'ChainlinkPairAggregator') => internalOracle('USDC', 'LINK', artifactName),
            dai_link: (artifactName = 'ChainlinkPairAggregator') => internalOracle('DAI', 'LINK', artifactName),
            custom: (sourceTokenName, targetTokenName, artifactName = 'ChainlinkPairAggregator') =>
                internalOracle(sourceTokenName.toUpperCase(), targetTokenName.toUpperCase(), artifactName),
        }),
        settings: () => {
            return {
                keyName: TELLER_KEY,
                contractName: 'Settings_Proxy',
                artifactName: 'Settings',
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
    ctokens: {
        get: (tokenName, artifactName = 'CErc20Interface') => {
            return {
                keyName: 'compound',
                contractName: tokenName.toUpperCase(),
                artifactName,
            };
        },
    },
    chainlink: {
        custom: (sourceTokenName, targetTokenName) =>
            internalChainlink(sourceTokenName.toUpperCase(), targetTokenName.toUpperCase()),
    }
};