const { encode } = require('../consts');

class IATMFactoryEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

IATMFactoryEncoder.prototype.encodeIsATM = function() {
    return encode(this.web3, 'isATM(address)');
}

module.exports = IATMFactoryEncoder;