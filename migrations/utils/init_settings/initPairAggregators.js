const assert = require('assert');
const _ = require('lodash');

module.exports = async function (
    instances,
    params,
) {
    console.log('\n');
    console.log('Registering pair aggregators in registry.');

    const { chainlinkAggregatorInstance } = instances;
    const { txConfig, chainlink, tokens } = params;

    for (const market in chainlink) {
        const { baseTokenName, quoteTokenName, address } = chainlink[market]
        const baseTokenAddress = tokens[baseTokenName];
        assert(baseTokenAddress, `Aggregator: base token address is undefined. Base token name: ${baseTokenName}`);
        const quoteTokenAddress = tokens[quoteTokenName];
        assert(quoteTokenAddress, `Aggregator: quote token address is undefined. Quote token name: ${quoteTokenName}`);

        await chainlinkAggregatorInstance.add(baseTokenAddress, quoteTokenAddress, address, txConfig);

        console.log(`Pair aggregator for market ${baseTokenName} / ${quoteTokenName}: ${address}`);
    }

    console.log('\n');
}