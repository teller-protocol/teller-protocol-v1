const { zerocollateral, tokens } = require("../../scripts/utils/contracts");
const { DEFAULT_DECIMALS } = require("./consts");

const collTokensOracleMap = new Map();
collTokensOracleMap.set('LINK', 'USD');

const getOraclePairsFor = (tokenName, collTokenName) => ({ source: collTokensOracleMap.get(collTokenName) || tokenName, target: collTokenName});

module.exports = {
    getOraclePairsFor,
    getOracleAggregatorInfo: (tokenName, collTokenName, artifactName = 'ChainlinkPairAggregator') => {
        const { source, target } = getOraclePairsFor(tokenName, collTokenName);
        const oracleAggregator = zerocollateral.oracles().custom(source, target, artifactName);
        return {
            ...oracleAggregator,
            pair: { source, target },
        };
    },
    getDecimals: async (getContracts, tokenName) => {
        let tokenDecimals = DEFAULT_DECIMALS;
        if(tokenName !== 'ETH') {
            const collateralTokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
            tokenDecimals = await collateralTokenInstance.decimals();
        }
        return tokenDecimals;
    },
};