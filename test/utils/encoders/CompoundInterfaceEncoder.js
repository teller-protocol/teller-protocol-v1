const { encode } = require('../consts');

class CompoundInterfaceEncoder {
  constructor(web3) {
    this.web3 = web3;
    assert(web3, 'Web3 instance is required.');
  }
}

CompoundInterfaceEncoder.prototype.encodeMint = function () {
  return encode(this.web3, 'mint(uint256)');
};

CompoundInterfaceEncoder.prototype.encodeRedeemUnderlying = function () {
  return encode(this.web3, 'redeemUnderlying(uint256)');
};

CompoundInterfaceEncoder.prototype.encodeExchangeRateStored = function () {
  return encode(this.web3, 'exchangeRateStored()');
};

CompoundInterfaceEncoder.prototype.encodeDecimals = function () {
  return encode(this.web3, 'decimals()');
};

CompoundInterfaceEncoder.prototype.encodeUnderlying = function () {
  return encode(this.web3, 'underlying()');
};

module.exports = CompoundInterfaceEncoder;
