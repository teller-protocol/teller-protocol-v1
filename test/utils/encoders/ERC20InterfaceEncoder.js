const { encode } = require('../consts');

class ERC20InterfaceEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

ERC20InterfaceEncoder.prototype.encodeBalanceOf = function() {
    return encode(this.web3, 'balanceOf(address)');
}

module.exports = ERC20InterfaceEncoder;