const _ = require('lodash');
const assert = require('assert');
const GetContracts = require('./GetContracts');
const { minutesToSeconds } = require('../../test/utils/consts');

class ProcessArgs {
    constructor(params = {}, defaultNetwork = 'test') {
        this.params = params;
        this.defaultNetwork = defaultNetwork;

        const network = this.network();
        console.log(`Script will be executed in network ${network}.`)
        this.appConf = require('../../config')(network);
        assert(this.appConf, 'App configuration is required.');
    }
}

ProcessArgs.prototype.getValue = function(paramName, defaultValue = undefined) {
    const value = this.params[paramName];
    const defaultValueLabel = defaultValue === undefined ? 'not-provided' : defaultValue;
    console.log(`Getting value (cli param) (or default '${defaultValueLabel}') for '${paramName}': '${value}'`);
    return value !== undefined ? value : defaultValue;
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

ProcessArgs.prototype.createInitializersConfig = function() {
    return {
        // Used to add signers in the LoanTermsConsensus contracts used for each token (or lending token).
        tokenNames: this.getValue('tokenName'),
        // Used to set as min required (responses) submissions when a borrower asks to node validators to sign responses.
        requiredSubmissions: this.getValue('requiredSubmissions'),
        // Used to set as min time window (in seconds) between last time borrower deposited collateral and when the borrower takes out the loan.
        safetyInterval: minutesToSeconds(
            this.getValue('safetyInterval')
        ),
        signerAddresses: this.getValue('signerAddress'),
    };
}

module.exports = ProcessArgs;