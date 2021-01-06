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
        }
    };
}
module.exports = {
    teller: {
        ttoken,
        eth: () => customCollateralToken(ETH),
        link: () => customCollateralToken(LINK),
        custom: (collateralToken) => customCollateralToken(collateralToken),
        logicVersionsRegistry: (artifactName = 'ILogicVersionsRegistry') => {
            return {
                keyName: TELLER_KEY,
                contractName: `LogicVersionsRegistry_Proxy`,
                artifactName,
            };
        },
        chainlinkAggregator: (artifactName = 'IChainlinkAggregator') => {
            return {
                keyName: TELLER_KEY,
                contractName: `ChainlinkAggregator_Proxy`,
                artifactName,
            };
        },
        settings: () => {
            return {
                keyName: TELLER_KEY,
                contractName: 'Settings_Proxy',
                artifactName: 'Settings',
            };
        },
        proxy: (contractLogicName, atAddress) => {
            return {
                keyName: TELLER_KEY,
                contractName: `${contractLogicName}_Proxy`,
                atAddress,
                artifactName: `${contractLogicName}`
            }
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
        get: (cTokenName, artifactName = 'CErc20Interface') => {
            return {
                keyName: 'compound',
                contractName: cTokenName.toUpperCase(),
                artifactName,
            };
        },
        fromTokenName: (tokenName, artifactName = 'CErc20Interface') => {
            return {
                keyName: 'compound',
                contractName: `C${tokenName.toUpperCase()}`,
                artifactName,
            };
        },
    }
};