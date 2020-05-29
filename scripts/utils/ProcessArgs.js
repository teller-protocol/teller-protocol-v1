const _ = require('lodash');
const assert = require('assert');
const GetContracts = require('./GetContracts');

class ProcessArgs {
    constructor(defaultNetwork = 'test', args = process.argv) {
        this.params = args;
        this.defaultNetwork = defaultNetwork;

        const network = this.network();
        console.log(`Script will be executed in network ${network}.`)
        this.appConf = require('../../config')(network);
        assert(this.appConf, 'App configuration is required.');
    }
}

ProcessArgs.prototype.getValue = function(paramName, defaultValue = undefined) {
    for (const index in this.params) {
        const param = this.params[index];
        if(param.toLowerCase() === `--${paramName.toLowerCase()}`) {
            const indexNumber = parseInt(index);
            let value = defaultValue;
            if(this.params.length >= (indexNumber + 1)) {
                value = this.params[(indexNumber + 1)];
            }
            console.log(`Getting value (cli param) (or default '${defaultValue}') for '${paramName}': '${value}'`);
            return value;
        }
    }
    return defaultValue;
}

ProcessArgs.prototype.getInt = function(paramName, defaultValue = 0) {
    const value = this.getValue(paramName, defaultValue);
    const intValue = _.parseInt(value);
    console.log(`Parsing int value ${value} => ${intValue}`);
    if (!_.isInteger(intValue)) {
        throw new Error(`Value (${value}) for param (cli param) ${paramName} is not a number.`);
    }
    return intValue;
}

ProcessArgs.prototype.network = function() {
    return this.getValue('network', this.defaultNetwork);
}

ProcessArgs.prototype.getCurrentConfig = function() {
    return this.appConf;
}

ProcessArgs.prototype.createGetContracts = function(artifacts) {
    const appConf = this.getCurrentConfig();
    const getContracts = new GetContracts(artifacts, appConf.networkConfig);
    return getContracts;
}

module.exports = ProcessArgs;