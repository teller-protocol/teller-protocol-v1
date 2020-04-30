const { encode } = require('../consts');

class PairAggregatorEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

PairAggregatorEncoder.prototype.encodeGetLatestAnswer = function() {
    return encode(this.web3, 'getLatestAnswer()');
}

module.exports = PairAggregatorEncoder;