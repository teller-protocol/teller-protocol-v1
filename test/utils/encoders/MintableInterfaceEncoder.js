const { encode } = require('../consts');
const ERC20InterfaceEncoder = require('./ERC20InterfaceEncoder');

class MintableInterfaceEncoder extends ERC20InterfaceEncoder {
  constructor(web3) {
    super(web3);
  }
}

MintableInterfaceEncoder.prototype.encodeMint = function () {
  return encode(this.web3, 'mint(address,uint256)');
};

module.exports = MintableInterfaceEncoder;
