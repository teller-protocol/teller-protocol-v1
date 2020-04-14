const ethUtil = require('ethereumjs-util');
const abi = require('ethereumjs-abi');
const web3Eth = require('web3-eth');
const {
  NETWORK_PROVIDER,
  COVERAGE_NETWORK,
} = require('../utils/consts');

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

async function signLoanHash(signer, loanHash, networkProvider, backupProvider) {
  let signature
  let eth

  try {
    eth = new web3Eth(networkProvider)
    signature = await eth.sign(ethUtil.bufferToHex(loanHash), signer)
  } catch {
    eth = new web3Eth(backupProvider)
    signature = await eth.sign(ethUtil.bufferToHex(loanHash), signer)
  }

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
  const signature = await signLoanHash(signer, hashedLoan, NETWORK_PROVIDER, COVERAGE_NETWORK);
  return signature;
}

module.exports = {
  hashLoan,
  signLoanHash,
  createSignature,
}