const { encode } = require('../consts');

class InterestValidatorEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

InterestValidatorEncoder.prototype.encodeIsInterestValid = function() {
    return encode(this.web3, 'isInterestValid(address,address,address,uint256)');
}

module.exports = InterestValidatorEncoder;
