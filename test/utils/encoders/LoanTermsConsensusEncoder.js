const abi = require('ethereumjs-abi');

class LoanTermsConsensusEncoder {
  constructor(web3, instance) {
    this.web3 = web3;
    this.instance = instance;
    assert(this.web3, 'Web3 instance is required.');
    assert(this.instance, 'Instance is required.');
  }
}

LoanTermsConsensusEncoder.prototype.encodeProcessRequest = function (request, responses) {
  return this.instance.contract.methods.processRequest(request, responses).encodeABI();
};

LoanTermsConsensusEncoder.prototype.encodeProcessRequestReturn = function (
  interestRate,
  collateralRatio,
  maxLoanAmount
) {
  return abi.rawEncode(
    ['uint256', 'uint256', 'uint256'],
    [interestRate.toString(), collateralRatio.toString(), maxLoanAmount.toString()]
  );
};

module.exports = LoanTermsConsensusEncoder;
