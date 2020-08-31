const { encode } = require('../consts');

class TLRTokenEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

TLRTokenEncoder.prototype.encodeTlrTokenLogic = function() {
    return encode(this.web3, 'tlrTokenLogic()');
}

module.exports = TLRTokenEncoder;