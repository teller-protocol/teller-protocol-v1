const envConfig = require('./config/env')();
const preamble = require('./docs/preamble');

// Environment Configuration
const addressCountValue = envConfig.getAddressCount().get();
const mnemonicKeyValue = envConfig.getMnemonic().get();
const infuraKeyValue = envConfig.getInfuraKey().get();
const gasKeyValue = envConfig.getGasWei().get();
const gasPriceKeyValue = envConfig.getGasPriceGwei().get();
const defaultAddressIndex = envConfig.getDefaultAddressIndex().get();
const etherscanApiKey = envConfig.getEtherscanApiKey().get();

const Web3 = require('web3');

const web3 = new Web3();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
	web3: Web3,
	plugins: [
		'solidity-coverage',
		'truffle-plugin-verify',
	],
	api_keys: {
		etherscan: etherscanApiKey,
	},
	verify: {
		preamble,
	},
	mocha: {
		enableTimeouts: false,
		reporter: 'eth-gas-reporter',
		reporterOptions : {
			currency: 'USD',
			showTimeSpent: true,
			excludeContracts: [
				'Migrations',
				'SimpleToken',
				'LendersMock',
				'LendersModifiersMock',
				'Mock',
				'LoansMock',
				'LendingPoolMock',
				'InitializableModifiersMock',
				'InterestConsensusMock',
				'NumbersListMock',
				'BaseMock',
				'ConsensusMock',
				'InterestConsensusModifiersMock',
			]
		},
	},
	compilers: {
		solc: {
			version: "0.5.17",
			optimizer: {
				enabled: true,
				runs: 200
			}
		}
	},
	networks: {
		ganache: {
			host: '127.0.0.1',
			port: 8545,
			network_id: '*',
			gas: gasKeyValue,
			gasPrice: 0x01,
		},
		ropsten: {
			provider: function() {
				return new HDWalletProvider(
					mnemonicKeyValue,
					`https://ropsten.infura.io/v3/${infuraKeyValue}`,
					defaultAddressIndex,
					addressCountValue
				);
			},
			gas: gasKeyValue,
			gasPrice: web3.utils.toWei(gasPriceKeyValue, 'gwei'),
			network_id: '3',
			skipDryRun: true,
		},
	}
}
