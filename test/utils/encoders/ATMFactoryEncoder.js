const { encode } = require('../consts');

class ATMFactoryEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

ATMFactoryEncoder.prototype.encodeIsATM = function() {
    return encode(this.web3, 'isATM(address)');
}

module.exports = ATMFactoryEncoder;
