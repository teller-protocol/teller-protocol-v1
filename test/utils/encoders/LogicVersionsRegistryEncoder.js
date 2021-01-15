const { encode } = require('../consts');

class LogicVersionsRegistryEncoder {
  constructor(web3) {
    this.web3 = web3;
    assert(web3, 'Web3 instance is required.');
  }
}

LogicVersionsRegistryEncoder.prototype.encodeGetLogicVersionAddress = function () {
  return encode(this.web3, 'getLogicVersionAddress(bytes32)');
};

LogicVersionsRegistryEncoder.prototype.encodeHasLogicVersion = function () {
  return encode(this.web3, 'hasLogicVersion(bytes32)');
};

LogicVersionsRegistryEncoder.prototype.encodeConsts = function () {
  return encode(this.web3, 'consts()');
};

module.exports = LogicVersionsRegistryEncoder;
