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

const createSignature = async (borrower, loanInfo, signer) => {
  const hashedLoan = hashLoan({
      interestRate: loanInfo.interestRate,
      collateralRatio: loanInfo.collateralRatio,
      borrower,
      maxLoanAmount: loanInfo.maxLoanAmount,
      numberDays: loanInfo.numberDays,
      signerNonce: loanInfo.signerNonce,
  });
  const signature = await signLoanHash(signer, hashedLoan);
  return signature;
}

module.exports = {
  hashLoan,
  signLoanHash,
  createSignature,
}