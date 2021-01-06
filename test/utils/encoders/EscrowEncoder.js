const { encode } = require('../consts');

class EscrowEncoder {
    constructor(web3) {
        this.web3 = web3
    }
}

EscrowEncoder.prototype.encodeCalculateTotalValue = function() {
    return encode(this.web3, 'calculateTotalValue()');
}

EscrowEncoder.prototype.encodeInitialize = function() {
    return encode(this.web3, 'initialize(address,uint256)');
}

EscrowEncoder.prototype.encodeClaimTokens = function() {
    return encode(this.web3, 'claimTokens(address)');
}

module.exports = EscrowEncoder;
