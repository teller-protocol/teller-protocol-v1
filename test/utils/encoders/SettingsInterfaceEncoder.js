const { encode } = require('../consts');

class SettingsInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

SettingsInterfaceEncoder.prototype.encodeExceedsMaxLendingAmount = function() {
    return encode(this.web3, 'exceedsMaxLendingAmount(address,uint256)');
}

SettingsInterfaceEncoder.prototype.encodeTermsExpiryTime = function() {
    return encode(this.web3, 'termsExpiryTime()');
}

module.exports = SettingsInterfaceEncoder;