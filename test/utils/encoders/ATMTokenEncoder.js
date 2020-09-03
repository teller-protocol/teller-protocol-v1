const { encode } = require('../consts');

class ATMTokenEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

module.exports = ATMTokenEncoder;