require('dotenv').config();
const EnvValue = require('./EnvValue');

const DEFAULT_GAS_WEI = "4600000";
const DEFAULT_ADDRESS_COUNT = "10";
const DEFAULT_ADDRESS_INDEX = "0";
const DEFAULT_GANACHE_PORT = "8545";
const DEFAULT_GANACHE_HOST = "127.0.0.1";
const DEFAULT_GANACHE_NETWORK_ID = "*";
const DEFAULT_GANACHE_GAS_PRICE = "20";

const ADDRESS_COUNT_KEY = 'ADDRESS_COUNT_KEY';
const DEFAULT_ADDRESS_INDEX_KEY = 'DEFAULT_ADDRESS_INDEX_KEY';
const MNEMONIC_KEY = 'MNEMONIC_KEY';
const INFURA_KEY = 'INFURA_KEY';
const GAS_WEI_KEY = 'GAS_WEI_KEY';
const GAS_PRICE_GWEI_KEY = 'GAS_PRICE_GWEI_KEY';
const ETHERSCAN_API_KEY = 'ETHERSCAN_API_KEY';
const GANACHE_PORT = 'GANACHE_PORT';
const GANACHE_HOST = 'GANACHE_HOST';
const GANACHE_NETWORK_ID = 'GANACHE_NETWORK';
const GANACHE_GAS_PRICE = 'GANACHE_GAS_PRICE';

class EnvConfig {
    constructor() {
        this.conf = new Map();
        this.initializeConf();
    }
}

EnvConfig.prototype.initializeConf = function() {
    this.createItem(DEFAULT_ADDRESS_INDEX_KEY, DEFAULT_ADDRESS_INDEX, 'This is the address index to be used as default.');
    this.createItem(ADDRESS_COUNT_KEY, DEFAULT_ADDRESS_COUNT, 'Addresses needed to deploy the smart contracts.');
    this.createItem(MNEMONIC_KEY, undefined, 'Mnemonic to generate addresses.');
    this.createItem(INFURA_KEY, undefined, 'Infura provider key used to deploy smart contracts.');
    this.createItem(GAS_WEI_KEY, DEFAULT_GAS_WEI, 'Default gas value in wei.');
    this.createItem(GAS_PRICE_GWEI_KEY, undefined, 'Default gas price value in gwei.');
    this.createItem(INFURA_KEY, undefined, 'Infura provider key is used to deploy smart contracts.');
    this.createItem(ETHERSCAN_API_KEY, undefined, 'Etherscan.io key is used to verify smart contracts.');
    // Ganache configuration
    this.createItem(GANACHE_HOST, DEFAULT_GANACHE_HOST, 'This is the host used to connect to the Ganache instance.');
    this.createItem(GANACHE_PORT, DEFAULT_GANACHE_PORT, 'This is the port used to connect to the Ganache instance.');
    this.createItem(GANACHE_NETWORK_ID, DEFAULT_GANACHE_NETWORK_ID, 'This is the network id used to connect to the Ganache instance.');
    this.createItem(GANACHE_GAS_PRICE, DEFAULT_GANACHE_GAS_PRICE, 'This is the gas price used to connect to the Ganache instance.');
}

EnvConfig.prototype.createItem = function(name, defaultValue = undefined, description = undefined) {
    const value = process.env[name];
    this.conf.set(name, new EnvValue(name, value, defaultValue, description));
}

EnvConfig.prototype.getMnemonic = function() {
    return this.conf.get(MNEMONIC_KEY);
}

EnvConfig.prototype.getInfuraKey = function() {
    return this.conf.get(INFURA_KEY);
}

EnvConfig.prototype.getAddressCount = function() {
    return this.conf.get(ADDRESS_COUNT_KEY);
}

EnvConfig.prototype.getGasWei = function() {
    return this.conf.get(GAS_WEI_KEY);
}

EnvConfig.prototype.getGasPriceGwei = function() {
    return this.conf.get(GAS_PRICE_GWEI_KEY);
}

EnvConfig.prototype.getDefaultAddressIndex = function() {
    return this.conf.get(DEFAULT_ADDRESS_INDEX_KEY);
}

EnvConfig.prototype.getEtherscanApiKey = function() {
    return this.conf.get(ETHERSCAN_API_KEY);
}

EnvConfig.prototype.validate = function() {
    if (!this.getMnemonic().hasValue()) {
        throw new Error('MNEMONIC_KEY env variable must be defined in your local .env file.');
    }
    if (!this.getGasPriceGwei().hasValue()) {
        throw new Error('GAS_PRICE_GWEI_KEY env variable must be defined in your local .env file.');
    }
}

EnvConfig.prototype.getGanacheHost = function() {
    return this.conf.get(GANACHE_HOST);
}

EnvConfig.prototype.getGanachePort = function() {
    return this.conf.get(GANACHE_PORT);
}

EnvConfig.prototype.getGanacheNetworkId = function() {
    return this.conf.get(GANACHE_NETWORK_ID);
}

EnvConfig.prototype.getGanacheGasPrice = function() {
    return this.conf.get(GANACHE_GAS_PRICE);
}

module.exports = EnvConfig;