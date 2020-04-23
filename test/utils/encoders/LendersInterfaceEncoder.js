const { encode } = require('../consts');

class LendersInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

LendersInterfaceEncoder.prototype.encodeRequestInterestUpdate = function() {
    return encode(this.web3, 'requestedInterestUpdate(address)');
}

module.exports = LendersInterfaceEncoder;