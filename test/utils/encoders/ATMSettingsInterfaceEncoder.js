const { encode } = require('../consts');

class ATMSettingsInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

ATMSettingsInterfaceEncoder.prototype.encodeIsATMForMarket = function() {
    return encode(this.web3, 'isATMForMarket(address, address, address)');
}

ATMSettingsInterfaceEncoder.prototype.encodeIsATMPaused = function() {
    return encode(this.web3, 'isATMPaused(address)');
}

ATMSettingsInterfaceEncoder.prototype.encodeGetATMForMarket = function() {
    return encode(this.web3, 'getATMForMarket(address,address)');
}

module.exports = ATMSettingsInterfaceEncoder;