const abijs = require('ethereumjs-abi');
const encode = (web3, signature) => {
    return web3.utils.sha3(signature).slice(0,10);
};
const encodeData = (web3, functionName, paramTypes, params) => {
    const functionSignature = encode(web3, functionName);
    const functionParamsEncoded = abijs.rawEncode(paramTypes, params);
    return `${functionSignature}${functionParamsEncoded.toString('hex')}`;
};

const SETTINGS_INITIALIZE_SIGNATURE = 'initialize(address)';
const SETTINGS_INITIALIZE_PARAM_TYPES = ['address'];

const LENDING_POOL_INITIALIZE_SIGNATURE = 'initialize(address,address,address,address,address,address,address,address)';
const LENDING_POOL_INITIALIZE_PARAM_TYPES = ['address', 'address', 'address', 'address', 'address', 'address', 'address', 'address'];

module.exports = {
    settingsABI: {
        encodeInitData: (web3, caller) => {
            const params = [caller];
            return encodeData(
                web3,
                SETTINGS_INITIALIZE_SIGNATURE,
                SETTINGS_INITIALIZE_PARAM_TYPES,
                params,
            );
        },
    },
    lendingPoolABI: {
        encodeInitData: (
            web3,
            tTokenAddress,
            tokenAddress,
            lendersAddress,
            loansAddress,
            cTokenAddress,
            settingsAddress,
            marketsStateAddress,
            interestValidatorAddress,
        ) => {
            const params = [
                tTokenAddress,
                tokenAddress,
                lendersAddress,
                loansAddress,
                cTokenAddress,
                settingsAddress,
                marketsStateAddress,
                interestValidatorAddress
            ];
            return encodeData(
                web3,
                LENDING_POOL_INITIALIZE_SIGNATURE,
                LENDING_POOL_INITIALIZE_PARAM_TYPES,
                params,
            );
        },
    },
}