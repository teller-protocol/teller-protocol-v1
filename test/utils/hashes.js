const ethUtil = require('ethereumjs-util')
const abi = require('ethereumjs-abi')
const web3Eth = require('web3-eth')

function hashLoan(loan) {
  return ethUtil.keccak256(
    abi.rawEncode(
      ['uint256', 'uint256', 'address', 'uint256', 'uint256', 'uint256'],
      [
        loan.interestRate,
        loan.collateralRatio,
        loan.borrower,
        loan.maxLoanAmount,
        loan.numberDays,
        loan.signerNonce,
      ]
    )
  )
}

async function signLoanHash(signer, loanHash, networkProvider) {
  const eth = new web3Eth(networkProvider)
  const signature = await eth.sign(ethUtil.bufferToHex(loanHash), signer)
  const { v, r, s } = ethUtil.fromRpcSig(signature)
  return {
    v: String(v),
    r: ethUtil.bufferToHex(r),
    s: ethUtil.bufferToHex(s),
  }
}

module.exports = {
  hashLoan,
  signLoanHash,
}