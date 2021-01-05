const abijs = require('ethereumjs-abi');
const encode = (web3, signature) => {
    return web3.utils.sha3(signature).slice(0,10);
};
const encodeData = (web3, functionName, paramTypes, params) => {
    const functionSignature = encode(web3, functionName);
    const functionParamsEncoded = abijs.rawEncode(paramTypes, params);
    return `${functionSignature}${functionParamsEncoded.toString('hex')}`;
};

const encodeParamsData = (paramTypes, params) => {
    const functionParamsEncoded = abijs.rawEncode(paramTypes, params);
    return `0x${functionParamsEncoded.toString('hex')}`;
};

const DAPP_MOCK_TEST_FUNCTION_SIGNATURE = 'testFunction(bool)';
const DAPP_MOCK_TEST_FUNCTION_PARAM_TYPES = ['bool'];
const DAPP_MOCK_INVALID_TEST_FUNCTION_SIGNATURE = 'invalidTestFunction(bool)';
const DAPP_MOCK_INVALID_TEST_FUNCTION_PARAM_TYPES = ['bool'];

const SETTINGS_INITIALIZE_SIGNATURE = 'initialize(address,address,address,address,address,address)';
const SETTINGS_INITIALIZE_PARAM_TYPES = ['address','address','address','address','address','address'];

const LENDING_POOL_INITIALIZE_SIGNATURE = 'initialize(address,address,address,address,address,address,address,address)';
const LENDING_POOL_INITIALIZE_PARAM_TYPES = ['address', 'address', 'address', 'address', 'address', 'address', 'address', 'address'];

module.exports = {
    encodeData,
    encodeParamsData,
    dappMockABI: {
        encodeTestFunction: (web3, failTransaction) => {
            const params = [failTransaction];
            return encodeData(
                web3,
                DAPP_MOCK_TEST_FUNCTION_SIGNATURE,
                DAPP_MOCK_TEST_FUNCTION_PARAM_TYPES,
                params,
            );
        },
        encodeInvalidTestFunction: (web3, failTransaction) => {
            const params = [failTransaction];
            return encodeData(
                web3,
                DAPP_MOCK_INVALID_TEST_FUNCTION_SIGNATURE,
                DAPP_MOCK_INVALID_TEST_FUNCTION_PARAM_TYPES,
                params,
            );
        },
    },
    settingsABI: {
        encodeInitData: (
            web3,
            escrowFactoryAddress,
            versionsRegistryAddress,
            chainlinkAggregatorAddress,
            marketsStateAddress,
            interestValidatorAddress,
            atmSettingsAddress,
            ) => {
            const params = [
                escrowFactoryAddress,
                versionsRegistryAddress,
                chainlinkAggregatorAddress,
                marketsStateAddress,
                interestValidatorAddress,
                atmSettingsAddress
            ];
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