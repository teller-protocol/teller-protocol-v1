const { encode } = require('../consts');

class EscrowFactoryInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

EscrowFactoryInterfaceEncoder.prototype.encodeCreateEscrow = function() {
    return encode(this.web3, 'createEscrow(address,uint256)');
}

module.exports = EscrowFactoryInterfaceEncoder;