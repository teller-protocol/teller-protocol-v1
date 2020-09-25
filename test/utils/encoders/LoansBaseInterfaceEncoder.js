const { encode } = require('../consts');

class LoansBaseInterfaceEncoder {
    constructor(web3) {
        this.web3 = web3
    }
}

LoansBaseInterfaceEncoder.prototype.encodeCollateralToken = function() {
    return encode(this.web3, 'collateralToken()');
}

LoansBaseInterfaceEncoder.prototype.encodeLendingPool = function() {
    return encode(this.web3, 'lendingPool()');
}

LoansBaseInterfaceEncoder.prototype.encodeLendingToken = function() {
    return encode(this.web3, 'lendingToken()');
}

LoansBaseInterfaceEncoder.prototype.encodeLoans = function() {
    return encode(this.web3, 'loans(uint256)');
}

LoansBaseInterfaceEncoder.prototype.encodeGetTotalOwed = function() {
    return encode(this.web3, 'getTotalOwed(uint256)');
}

LoansBaseInterfaceEncoder.prototype.encodeCanLiquidateLoan = function() {
    return encode(this.web3, 'canLiquidateLoan(uint256)');
}

LoansBaseInterfaceEncoder.prototype.encodeRepay = function() {
    return encode(this.web3, 'repay(uint256,uint256)');
}

LoansBaseInterfaceEncoder.prototype.encodeIsLoanSecured = function() {
    return encode(this.web3, 'isLoanSecured(uint256)');
}

module.exports = LoansBaseInterfaceEncoder;