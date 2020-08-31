const _ = require('lodash');
const getEnvConfiguration = require('./env');
const Mock = artifacts.require("./mock/util/Mock.sol");

module.exports = async (network) => {
	try {
		const networkConfig = require(`./networks/${network}`);
		if (_.isNaN(networkConfig) || _.isUndefined(networkConfig) || _.isNull(networkConfig)) {
			throw new Error(`Config for network ${network} not found.`);
		}

		if (network === 'test') {
			await deployDummyMocks(networkConfig)
		}

		return {
			networkConfig: networkConfig,
			env: getEnvConfiguration(),
		};
	} catch (error) {
        console.error(`Error loading configuration for ${network}`, error);
        throw error;
	}
};

async function deployDummyMocks(networkConfig) {
	const { tokens, compound, chainlink } = networkConfig

	// tokens
	for (const symbol in tokens) {
		if (symbol === 'ETH') continue

		tokens[symbol] = (await Mock.new()).address
	}

	// compound
	for (const symbol in compound) {
		compound[symbol] = (await Mock.new()).address
	}

	// compound
	for (const pair in chainlink) {
		chainlink[pair].address = (await Mock.new()).address
	}
}