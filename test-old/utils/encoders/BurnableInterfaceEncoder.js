const { encode } = require('../consts');
const ERC20InterfaceEncoder = require('./ERC20InterfaceEncoder');

class BurnableInterfaceEncoder extends ERC20InterfaceEncoder {
    constructor(web3) {
        super(web3);
    }
}

BurnableInterfaceEncoder.prototype.encodeBurn = function() {
    return encode(this.web3, 'burn(uint256)');
}

module.exports = BurnableInterfaceEncoder;