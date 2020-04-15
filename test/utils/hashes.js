const ethUtil = require('ethereumjs-util')
const abi = require('ethereumjs-abi')

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

async function signLoanHash(signer, loanHash) {
  const signature = await web3.eth.sign(ethUtil.bufferToHex(loanHash), signer);
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