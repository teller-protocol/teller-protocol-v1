const { encode } = require('../consts');

class EscrowInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3
    }
}

EscrowInterfaceEncoder.prototype.encodeIsUnderValued = function() {
    return encode(this.web3, 'isUnderValued()');
}

EscrowInterfaceEncoder.prototype.encodeInitialize = function() {
    return encode(this.web3, 'initialize(address,uint256)');
}

EscrowInterfaceEncoder.prototype.encodeClaimTokens = function() {
    return encode(this.web3, 'claimTokens(address)');
}

module.exports = EscrowInterfaceEncoder;