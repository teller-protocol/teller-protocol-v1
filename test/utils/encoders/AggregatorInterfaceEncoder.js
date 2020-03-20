const { encode } = require('../consts');

class AggregatorInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

AggregatorInterfaceEncoder.prototype.encodeLatestAnswer = function() {
    return encode(this.web3, 'latestAnswer()');
}

AggregatorInterfaceEncoder.prototype.encodeLatestTimestamp = function() {
    return encode(this.web3, 'latestTimestamp()');
}

AggregatorInterfaceEncoder.prototype.encodeGetAnswer = function() {
    return encode(this.web3, 'getAnswer(uint256)');
}

AggregatorInterfaceEncoder.prototype.encodeGetTimestamp = function() {
    return encode(this.web3, 'getTimestamp(uint256)');
}

AggregatorInterfaceEncoder.prototype.encodeLatestRound = function() {
    return encode(this.web3, 'latestRound()');
}

module.exports = AggregatorInterfaceEncoder;