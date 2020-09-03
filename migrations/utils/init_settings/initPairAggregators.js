const assert = require('assert');

module.exports = async function (
    instances,
    params,
) {
    console.log('\n');
    console.log('Registering pair aggregators in registry.');
    const { pairAggregatorRegistryInstance } = instances;
    const { txConfig, chainlink, tokens } = params;
    const chainlinkEntries =  Object.entries(chainlink);
    console.log(`Registering ${chainlinkEntries.length} pair aggregators.`);
    for (const [, aggregatorInfo] of chainlinkEntries) {
        const {
            address,
            inversed,
            collateralDecimals,
            responseDecimals,
            baseTokenName,
            quoteTokenName
        } = aggregatorInfo;

        console.log(`Registering pair aggregator: Inverse: ${inversed} - Market: ${baseTokenName} / ${quoteTokenName} - Chainlink Oracle: ${address}.`)
        const baseTokenAddress = tokens[baseTokenName];
        assert(baseTokenAddress, `Aggregator: base token address is undefined. Base token name: ${baseTokenName}`);
        const quoteTokenAddress = tokens[quoteTokenName];
        assert(quoteTokenAddress, `Aggregator: quote token address is undefined. Quote token name: ${quoteTokenName}`);

        const registerRequest = {
            baseToken: baseTokenAddress,
            quoteToken: quoteTokenAddress,
            chainlinkAggregatorAddress: address,
            inverse: inversed,
            responseDecimals,
            collateralDecimals,
        };
        await pairAggregatorRegistryInstance.registerPairAggregator(
            registerRequest,
            txConfig,
        );
        console.log(`Registered pair aggregator: Inverse: ${registerRequest.inverse} - ${baseTokenName} (${registerRequest.baseToken}) - ${quoteTokenName} / (${registerRequest.quoteToken}) - Chainlink Oracle: ${registerRequest.chainlinkAggregatorAddress}.`)

        const inverseRegisterRequest = {
            baseToken: quoteTokenAddress,
            quoteToken: baseTokenAddress,
            chainlinkAggregatorAddress: address,
            inverse: !inversed,
            responseDecimals,
            collateralDecimals,
        };
        await pairAggregatorRegistryInstance.registerPairAggregator(
            inverseRegisterRequest,
            txConfig,
        );
        console.log(`Registered pair aggregator: Inverse: ${inverseRegisterRequest.inverse} - ${quoteTokenName} (${inverseRegisterRequest.baseToken}) - ${baseTokenName} / (${inverseRegisterRequest.quoteToken}) - Chainlink Oracle: ${inverseRegisterRequest.chainlinkAggregatorAddress}.`)
    }
    console.log('\n');
}