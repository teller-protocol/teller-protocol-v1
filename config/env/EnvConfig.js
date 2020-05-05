require('dotenv').config();
const EnvValue = require('./EnvValue');

const DEFAULT_GAS_WEI = "4600000";
const DEFAULT_ADDRESS_COUNT = "10";
const DEFAULT_ADDRESS_INDEX = "0";
const DEFAULT_REQUIRED_SUBMISSIONS = "7";
const DEFAULT_MAXIMUM_TOLERANCE = "0";
const DEFAULT_RESPONSE_EXPIRY = "2592000"; // 30 days
const DEFAULT_SAFETY_INTERVAL = "300" // 5 minutes

const ADDRESS_COUNT_KEY = 'ADDRESS_COUNT_KEY';
const DEFAULT_ADDRESS_INDEX_KEY = 'DEFAULT_ADDRESS_INDEX_KEY';
const MNEMONIC_KEY = 'MNEMONIC_KEY';
const INFURA_KEY = 'INFURA_KEY';
const GAS_WEI_KEY = 'GAS_WEI_KEY';
const GAS_PRICE_GWEI_KEY = 'GAS_PRICE_GWEI_KEY';
const ETHERSCAN_API_KEY = 'ETHERSCAN_API_KEY';
const DEFAULT_REQUIRED_SUBMISSIONS_KEY = 'DEFAULT_REQUIRED_SUBMISSIONS_KEY'
const DEFAULT_MAXIMUM_TOLERANCE_KEY = 'DEFAULT_MAXIMUM_TOLERANCE_KEY'
const DEFAULT_RESPONSE_EXPIRY_KEY = 'DEFAULT_RESPONSE_EXPIRY_KEY'
const DEFAULT_SAFETY_INTERVAL_KEY = 'DEFAULT_SAFETY_INTERVAL_KEY'

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
    this.createItem(DEFAULT_REQUIRED_SUBMISSIONS_KEY, DEFAULT_REQUIRED_SUBMISSIONS, 'This is the default number of node submissions for consensus.');
    this.createItem(DEFAULT_MAXIMUM_TOLERANCE_KEY, DEFAULT_MAXIMUM_TOLERANCE, 'This is the maximum tolerance of difference in node submissions.');
    this.createItem(DEFAULT_RESPONSE_EXPIRY_KEY, DEFAULT_RESPONSE_EXPIRY, 'This is the time after which node responses expire.');
    this.createItem(DEFAULT_SAFETY_INTERVAL_KEY, DEFAULT_SAFETY_INTERVAL, 'This is the time between depositing collateral and taking out a loan.');
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

EnvConfig.prototype.getDefaultRequiredSubmissions = function() {
  return this.conf.get(DEFAULT_REQUIRED_SUBMISSIONS_KEY);
}

EnvConfig.prototype.getDefaultMaximumTolerance = function() {
  return this.conf.get(DEFAULT_MAXIMUM_TOLERANCE_KEY);
}

EnvConfig.prototype.getDefaultResponseExpiry = function() {
  return this.conf.get(DEFAULT_RESPONSE_EXPIRY_KEY);
}

EnvConfig.prototype.getDefaultSafetyInterval = function() {
  return this.conf.get(DEFAULT_SAFETY_INTERVAL_KEY);
}

module.exports = EnvConfig;