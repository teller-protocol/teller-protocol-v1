const _ = require('lodash');
const assert = require('assert');
const GetContracts = require('./GetContracts');
const { minutesToSeconds } = require('../../test/utils/consts');
const chains = require('../../test/utils/chains');

class ProcessArgs {
  constructor(params = {}, defaultNetwork = 'test') {
    this.params = params;
    this.defaultNetwork = defaultNetwork;

    const network = this.network();
    console.log(`Script will be executed in network ${network}.`);
    this.appConf = require('../../config')(network);
    assert(this.appConf, 'App configuration is required.');
  }
}

ProcessArgs.prototype.getValue = function (paramName, defaultValue = undefined) {
  const value = this.params[paramName];
  const defaultValueLabel = defaultValue === undefined ? 'not-provided' : defaultValue;
  console.log(
    `Getting cli param for '${paramName}': '${value}' (default '${defaultValueLabel}')`
  );
  return value !== undefined ? value : defaultValue;
};

ProcessArgs.prototype.network = function () {
  return this.getValue('network', this.defaultNetwork);
};

ProcessArgs.prototype.getCurrentConfig = function () {
  return this.appConf;
};

ProcessArgs.prototype.getChainId = function () {
  const network = this.network();
  const id = chains[network.toLowerCase()];
  return id;
};

ProcessArgs.prototype.createGetContracts = function (artifacts) {
  const appConf = this.getCurrentConfig();
  const getContracts = new GetContracts(artifacts, appConf.networkConfig);
  return getContracts;
};

module.exports = ProcessArgs;
