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
            return this.params.length >= (indexNumber + 1) ? this.params[(indexNumber + 1)] : defaultValue;
        }
    }
    return defaultValue;
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