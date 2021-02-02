const { encode } = require('../consts');

class AggregatorV2V3InterfaceEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

AggregatorV2V3InterfaceEncoder.prototype.encodeLatestAnswer = function () {
    return encode(this.web3, 'latestAnswer()')
}

AggregatorV2V3InterfaceEncoder.prototype.encodeDecimals = function () {
    return encode(this.web3, 'decimals()')
}

module.exports = AggregatorV2V3InterfaceEncoder;