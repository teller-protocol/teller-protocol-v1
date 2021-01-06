const { encode } = require('../consts');

class LendingPoolEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

LendingPoolEncoder.prototype.encodeLendingToken = function() {
    return encode(this.web3, 'lendingToken()');
}

module.exports = LendingPoolEncoder;
