const assert = require('assert');

module.exports = async function (
    instances,
    params,
) {
    console.log('\n');
    console.log('Registering pair aggregators in registry.');
    const { pairAggregatorRegistryInstance } = instances;
    const { txConfig, chainlink, tokens } = params;
    const chainlinkValues =  Object.values(chainlink);

    const registerRequests = chainlinkValues.map(
        ({
            address,
            inversed,
            collateralDecimals,
            responseDecimals,
            baseTokenName,
            quoteTokenName
        }) => {
        const baseTokenAddress = tokens[baseTokenName];
        assert(baseTokenAddress, `Aggregator: base token address is undefined. Base token name: ${baseTokenName}`);
        const quoteTokenAddress = tokens[quoteTokenName];
        assert(quoteTokenAddress, `Aggregator: quote token address is undefined. Quote token name: ${quoteTokenName}`);
        console.log(`Pair aggregator: Inverse: ${inversed} - Market: ${baseTokenAddress} / ${quoteTokenAddress} - Chainlink Oracle: ${address}.`)
        return {
            baseToken: baseTokenAddress,
            quoteToken: quoteTokenAddress,
            chainlinkAggregatorAddress: address,
            inverse: inversed,
            responseDecimals,
            collateralDecimals,
        };
    });
    console.log('\n');

    await pairAggregatorRegistryInstance.registerPairAggregators(
        registerRequests,
        txConfig,
    );

    const inverseRegisterRequests = registerRequests.map( ({
        baseToken,
        quoteToken,
        chainlinkAggregatorAddress,
        inverse,
        responseDecimals,
        collateralDecimals,
    }) => {
        const inverseRequest = {
            baseToken: quoteToken,
            quoteToken: baseToken,
            chainlinkAggregatorAddress,
            inverse: !inverse,
            responseDecimals,
            collateralDecimals,
        };
        console.log(`Pair aggregator: Inverse: ${inverseRequest.inverse} - Market: ${inverseRequest.baseToken} / ${inverseRequest.quoteToken} - Chainlink Oracle: ${inverseRequest.chainlinkAggregatorAddress}.`)
        return inverseRequest;
    });

    await pairAggregatorRegistryInstance.registerPairAggregators(
        inverseRegisterRequests,
        txConfig,
    );
    console.log('\n');
}