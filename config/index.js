const _ = require('lodash');
const getEnvConfiguration = require('./env');

module.exports = (network) => {
	try {
		const networkConfig = require(`./networks/${network}`);
		if (_.isNaN(networkConfig) || _.isUndefined(networkConfig) || _.isNull(networkConfig)) {
			throw new Error(`Config for network ${network} not found.`);
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