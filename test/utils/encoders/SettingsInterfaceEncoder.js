const { encode } = require('../consts');

class SettingsInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

SettingsInterfaceEncoder.prototype.encodeTermsExpiryTime = function() {
    return encode(this.web3, 'termsExpiryTime()');
}

SettingsInterfaceEncoder.prototype.encodeMaximumLoanDuration = function() {
    return encode(this.web3, 'maximumLoanDuration()');
}

module.exports = SettingsInterfaceEncoder;