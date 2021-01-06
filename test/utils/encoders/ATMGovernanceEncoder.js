const { encode } = require('../consts');

class ATMGovernanceEncoder {
    constructor(web3) {
        this.web3 = web3;
        assert(web3, 'Web3 instance is required.');
    }
}

ATMGovernanceEncoder.prototype.encodeGetGeneralSetting = function() {
    return encode(this.web3, 'getGeneralSetting(bytes32)');
}

module.exports = ATMGovernanceEncoder;
