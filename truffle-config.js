const envConfig = require('./config/env')();

// Environment Configuration
const addressCountValue = envConfig.getAddressCount().get();
const mnemonicKeyValue = envConfig.getMnemonic().get();
const infuraKeyValue = envConfig.getInfuraKey().get();
const gasKeyValue = envConfig.getGasWei().get();
const gasPriceKeyValue = envConfig.getGasPriceGwei().get();
const defaultAddressIndex = envConfig.getDefaultAddressIndex().get();

const Web3 = require('web3');

const web3 = new Web3();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
	web3: Web3,
	plugins: ["solidity-coverage"],
	mocha: {
		enableTimeouts: false,
		reporter: 'eth-gas-reporter',
		reporterOptions : {
			currency: 'USD',
			excludeContracts: ['Migrations'],
			showTimeSpent: true,
			excludeContracts: [
				'Migrations',
				'SimpleToken',
				'LenderInfoMock',
				'LenderInfoModifiersMock',
				'Mock',
				'ZeroCollateralMock'
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
    // development: {
    //   host: "localhost",
    //   port: 8555,
    //   network_id: "*" // match any network
    // },
		ganache: {
			host: '127.0.0.1',
			port: 8545,
			network_id: '*',
			gas: 0x90F560,
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
