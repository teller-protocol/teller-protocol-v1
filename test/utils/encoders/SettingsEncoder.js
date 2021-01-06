const { encode } = require('../consts');

class SettingsEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

SettingsEncoder.prototype.encodeGetPlatformSettingValue = function() {
    return encode(this.web3, 'getPlatformSettingValue(bytes32)');
}

SettingsEncoder.prototype.encodeHasPauserRole = function() {
    return encode(this.web3, 'hasPauserRole(address)');
}

SettingsEncoder.prototype.encodeRequirePauserRole = function() {
    return encode(this.web3, 'requirePauserRole(address)');
}

SettingsEncoder.prototype.encodeIsPaused = function() {
    return encode(this.web3, 'isPaused()');
}

SettingsEncoder.prototype.encodeIsPoolPaused = function() {
    return encode(this.web3, 'isPoolPaused(address)');
}

SettingsEncoder.prototype.encodeMarketsState = function() {
    return encode(this.web3, 'marketsState()');
}

SettingsEncoder.prototype.encodeEscrowFactory = function() {
    return encode(this.web3, 'escrowFactory()');
}

SettingsEncoder.prototype.encodeETH_ADDRESS = function() {
    return encode(this.web3, 'ETH_ADDRESS()');
}

SettingsEncoder.prototype.encodeATMSettings = function() {
    return encode(this.web3, 'atmSettings()');
}

SettingsEncoder.prototype.encodeMarketsState = function() {
    return encode(this.web3, 'marketsState()');
}

SettingsEncoder.prototype.encodeVersionsRegistry = function() {
    return encode(this.web3, 'versionsRegistry()');
}

SettingsEncoder.prototype.encodeInterestValidator = function() {
    return encode(this.web3, 'interestValidator()');
}

SettingsEncoder.prototype.encodeGetAssetSettings = function() {
    return encode(this.web3, 'getAssetSettings(address)');
}

SettingsEncoder.prototype.encodeGetCTokenAddress = function() {
    return encode(this.web3, 'getCTokenAddress(address)');
}

module.exports = SettingsEncoder;
