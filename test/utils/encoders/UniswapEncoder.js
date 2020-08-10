const { encode } = require('../consts')

class UniswapEncoder {
    constructor(web3) {
        this.web3 = web3
        assert(web3, 'Web3 instance is required.')
    }

    encodeRouterTokensForTokens() {
        return encode(this.web3, 'swapExactTokensForTokens(uint,uint,address[],address,uint)')
    }

    encodeRouterTokensForETH() {
        return encode(this.web3, 'swapExactTokensForETH(uint,uint,address[],address,uint)')
    }

    encodeRouterETHForTokens() {
        return encode(this.web3, 'swapExactETHForTokens(uint,address[],address,uint)')
    }
}

module.exports = UniswapEncoder