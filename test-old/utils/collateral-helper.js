const { tokens } = require("../../scripts/utils/contracts");
const { DEFAULT_DECIMALS } = require("./consts");

module.exports = {
    getDecimals: async (getContracts, tokenName) => {
        let tokenDecimals = DEFAULT_DECIMALS;
        if(tokenName !== 'ETH') {
            const collateralTokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
            tokenDecimals = await collateralTokenInstance.decimals();
        }
        return tokenDecimals;
    },
};