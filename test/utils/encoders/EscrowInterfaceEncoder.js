const { encode } = require('../consts');

class EscrowInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3
    }
}

EscrowInterfaceEncoder.prototype.encodeCalculateLoanValue = function() {
    return encode(this.web3, 'calculateLoanValue()');
}

EscrowInterfaceEncoder.prototype.encodeInitialize = function() {
    return encode(this.web3, 'initialize(address,uint256)');
}

EscrowInterfaceEncoder.prototype.encodeClaimTokens = function() {
    return encode(this.web3, 'claimTokens(address)');
}

module.exports = EscrowInterfaceEncoder;