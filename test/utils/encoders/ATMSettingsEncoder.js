const { encode } = require('../consts');

class ATMSettingsEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

ATMSettingsEncoder.prototype.encodeIsATMForMarket = function() {
    return encode(this.web3, 'isATMForMarket(address, address, address)');
}

ATMSettingsEncoder.prototype.encodeIsATMPaused = function() {
    return encode(this.web3, 'isATMPaused(address)');
}

ATMSettingsEncoder.prototype.encodeGetATMForMarket = function() {
    return encode(this.web3, 'getATMForMarket(address,address)');
}

ATMSettingsEncoder.prototype.encodeSettings = function() {
    return encode(this.web3, 'settings()')
}

module.exports = ATMSettingsEncoder;
