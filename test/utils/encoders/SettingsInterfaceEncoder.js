const { encode } = require('../consts');

class SettingsInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

SettingsInterfaceEncoder.prototype.encodeGetPlatformSettingValue = function() {
    return encode(this.web3, 'getPlatformSettingValue(bytes32)');
}

SettingsInterfaceEncoder.prototype.encodeHasPauserRole = function() {
    return encode(this.web3, 'hasPauserRole(address)');
}

module.exports = SettingsInterfaceEncoder;