const { encode } = require('../consts');

class MintableInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

MintableInterfaceEncoder.prototype.encodeMint = function() {
    return encode(this.web3, 'mint(address,uint256)');
}

module.exports = MintableInterfaceEncoder;