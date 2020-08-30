const assert = require('assert');
const {
    toDecimals, toBytes32
} = require('../../../test/utils/consts');
const { add } = require('lodash');

module.exports = async function (
    logicContracts,
    instances,
    params,
) {
    console.log('\n');
    console.log('Registering pair aggregators in registry.');
    const { pairAggregatorRegistryInstance } = instances;
    const { txConfig, chainlink, tokens } = params;
    return;//TODO Fix CONTRACT_ALREADY_INITIALIZED 
    const chainlinkEntries =  Object.entries(chainlink);
    console.log(`Registering ${chainlinkEntries.length} pair aggregators.`);
    for (const [key, aggregatorInfo] of chainlinkEntries) {
        const {
            address,
            inversed,
            collateralDecimals,
            responseDecimals,
            baseTokenName,
            quoteTokenName
        } = aggregatorInfo;

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
          }

        await pairAggregatorRegistryInstance.registerPairAggregator(
            registerRequest,
            txConfig,
        );
        console.log(`Registered pair aggregator: Inverse: ${inversed} - ${baseTokenName} (${baseTokenAddress}) - ${quoteTokenName} / (${quoteTokenAddress}) - Chainlink Oracle: ${address}.`)
    }
    console.log('\n');
}