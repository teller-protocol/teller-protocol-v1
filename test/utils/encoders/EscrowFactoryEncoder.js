const { encode } = require('../consts');

class EscrowFactoryEncoder {
  constructor(web3) {
    this.web3 = web3;
    assert(web3, 'Web3 instance is required.');
  }
}

EscrowFactoryEncoder.prototype.encodeIsDapp = function () {
  return encode(this.web3, 'isDapp(address)');
};

EscrowFactoryEncoder.prototype.encodeDapps = function () {
  return encode(this.web3, 'dapps(address)');
};

EscrowFactoryEncoder.prototype.encodeCreateEscrow = function () {
  return encode(this.web3, 'createEscrow(address,uint256)');
};

module.exports = EscrowFactoryEncoder;
