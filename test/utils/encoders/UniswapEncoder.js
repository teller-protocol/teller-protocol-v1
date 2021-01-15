const { encode } = require('../consts');

class UniswapEncoder {
  constructor(web3) {
    this.web3 = web3;
    assert(web3, 'Web3 instance is required.');
  }
}
UniswapEncoder.prototype.encodeSwapExactTokensForTokens = function () {
  return encode(this.web3, 'swapExactTokensForTokens(uint,uint,address[],address,uint)');
};

UniswapEncoder.prototype.encodeSwapExactTokensForETH = function () {
  return encode(this.web3, 'swapExactTokensForETH(uint,uint,address[],address,uint)');
};

UniswapEncoder.prototype.encodeSwapExactETHForTokens = function () {
  return encode(this.web3, 'swapExactETHForTokens(uint,address[],address,uint)');
};

module.exports = UniswapEncoder;
