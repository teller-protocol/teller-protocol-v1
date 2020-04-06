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

ERC20InterfaceEncoder.prototype.encodeAllowance = function() {
    return encode(this.web3, 'allowance(address,address)');
}

ERC20InterfaceEncoder.prototype.encodeTransferFrom = function() {
    return encode(this.web3, 'transferFrom(address,address,uint256)');
}

ERC20InterfaceEncoder.prototype.encodeTransfer = function() {
    return encode(this.web3, 'transfer(address,uint256)');
}

module.exports = ERC20InterfaceEncoder;