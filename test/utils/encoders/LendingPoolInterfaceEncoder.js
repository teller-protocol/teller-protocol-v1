const { encode } = require('../consts');

class LendingPoolInterfaceEncoder {
  constructor(web3) {
    this.web3 = web3;
    assert(web3, 'Web3 instance is required.');
  }
}

LendingPoolInterfaceEncoder.prototype.encodeLendingToken = function () {
  return encode(this.web3, 'lendingToken()');
};

LendingPoolInterfaceEncoder.prototype.encodeGetDebtRatioFor = function () {
  return encode(this.web3, 'getDebtRatioFor(uint256)');
};

module.exports = LendingPoolInterfaceEncoder;
