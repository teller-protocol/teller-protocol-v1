const { encode } = require('../consts');

class LoansBaseInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3
    }
}

LoansBaseInterfaceEncoder.prototype.encodeCollateralToken = function() {
    return encode(this.web3, 'collateralToken()');
}

LoansBaseInterfaceEncoder.prototype.encodeLendingToken = function() {
    return encode(this.web3, 'lendingToken()');
}

LoansBaseInterfaceEncoder.prototype.encodeLoans = function() {
    return encode(this.web3, 'loans(uint256)');
}

module.exports = LoansBaseInterfaceEncoder;