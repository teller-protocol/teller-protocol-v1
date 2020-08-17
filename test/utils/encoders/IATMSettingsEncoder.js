const { encode } = require('../consts');

class IATMSettingsEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

IATMSettingsEncoder.prototype.encodeIsATMForMarket = function() {
    return encode(this.web3, 'isATMForMarket(address, address, address)');
}

IATMSettingsEncoder.prototype.encodeIsATMPaused = function() {
    return encode(this.web3, 'isATMPaused(address)');
}

IATMSettingsEncoder.prototype.encodeGetATMForMarket = function() {
    return encode(this.web3, 'getATMForMarket(address,address)');
}

module.exports = IATMSettingsEncoder;