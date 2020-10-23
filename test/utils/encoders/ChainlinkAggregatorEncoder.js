const { encode } = require('../consts');

class ChainlinkAggregatorEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

ChainlinkAggregatorEncoder.prototype.encodeValueFor = function () {
    return encode(this.web3, 'valueFor(address,address,uint256)')
}

ChainlinkAggregatorEncoder.prototype.encodeLatestAnswerFor = function () {
    return encode(this.web3, 'latestAnswerFor(address,address)')
}

module.exports = ChainlinkAggregatorEncoder;