const { encode } = require('../consts');

class LoansBaseEncoder {
    constructor(web3) {
        this.web3 = web3
    }
}

LoansBaseEncoder.prototype.encodeCollateralToken = function() {
    return encode(this.web3, 'collateralToken()');
}

LoansBaseEncoder.prototype.encodeLendingPool = function() {
    return encode(this.web3, 'lendingPool()');
}

LoansBaseEncoder.prototype.encodeLendingToken = function() {
    return encode(this.web3, 'lendingToken()');
}

LoansBaseEncoder.prototype.encodeLoans = function() {
    return encode(this.web3, 'loans(uint256)');
}

LoansBaseEncoder.prototype.encodeGetTotalOwed = function() {
    return encode(this.web3, 'getTotalOwed(uint256)');
}

LoansBaseEncoder.prototype.encodeCanLiquidateLoan = function() {
    return encode(this.web3, 'canLiquidateLoan(uint256)');
}

LoansBaseEncoder.prototype.encodeRepay = function() {
    return encode(this.web3, 'repay(uint256,uint256)');
}

LoansBaseEncoder.prototype.encodeIsLoanSecured = function() {
    return encode(this.web3, 'isLoanSecured(uint256)');
}

module.exports = LoansBaseEncoder;
