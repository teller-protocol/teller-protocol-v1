const { encode } = require('../consts');

class CTokenEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

CTokenEncoder.prototype.encodeMint = function() {
    return encode(this.web3, 'mint(uint256)');
}

CTokenEncoder.prototype.encodeRedeemUnderlying = function() {
    return encode(this.web3, 'redeemUnderlying(uint256)');
}

CTokenEncoder.prototype.encodeUnderlying = function() {
    return encode(this.web3, 'underlying()');
}

CTokenEncoder.prototype.encodeExchangeRateStored = function() {
    return encode(this.web3, 'exchangeRateStored()');
}

CTokenEncoder.prototype.encodeDecimals = function() {
    return encode(this.web3, 'decimals()');
}

module.exports = CTokenEncoder;
