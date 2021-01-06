const { encode } = require('../consts');

class MarketsStateEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

MarketsStateEncoder.prototype.encodeGetDebtRatioFor = function() {
    return encode(this.web3, 'getDebtRatioFor(address,address,uint256)');
}

module.exports = MarketsStateEncoder;
