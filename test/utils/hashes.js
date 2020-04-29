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

function hashResponse(response, requestHash) {
  return ethUtil.keccak256(
    abi.rawEncode(
      ['uint256', 'uint256', 'uint256', 'bytes32'],
      [
        response.responseTime,
        response.interest,
        response.signature.signerNonce,
        requestHash,
      ]
    )
  )
}

function hashRequest(request, msgSender) {
  return ethUtil.keccak256(
    abi.rawEncode(
      ['address', 'address', 'uint256', 'uint256', 'uint256'],
      [
        msgSender,
        request.lender,
        request.startTime,
        request.endTime,
        request.requestTime
      ]
    )
  )
}

async function signHash(web3, signer, hash) {
  const signature = await web3.eth.sign(ethUtil.bufferToHex(hash), signer);
  const { v, r, s } = ethUtil.fromRpcSig(signature)
  return {
    v: String(v),
    r: ethUtil.bufferToHex(r),
    s: ethUtil.bufferToHex(s),
  }
}

async function createResponseSig(web3, signer, interestResponse, requestHash) {
  const responseHash = hashResponse(interestResponse, requestHash)
  const signature = await web3.eth.sign(ethUtil.bufferToHex(responseHash), signer);
  const { v, r, s } = ethUtil.fromRpcSig(signature)
  interestResponse.signature.v = String(v)
  interestResponse.signature.r = ethUtil.bufferToHex(r)
  interestResponse.signature.s = ethUtil.bufferToHex(s)
  return interestResponse
}

const createLoanSig = async (web3, borrower, loanInfo, signer) => {
  const hashedLoan = hashLoan({
      interestRate: loanInfo.interestRate,
      collateralRatio: loanInfo.collateralRatio,
      borrower,
      maxLoanAmount: loanInfo.maxLoanAmount,
      numberDays: loanInfo.numberDays,
      signerNonce: loanInfo.signerNonce,
  });
  const signature = await signHash(web3, signer, hashedLoan);
  return signature;
}

module.exports = {
  hashLoan,
  hashRequest,
  hashResponse,
  signHash,
  createLoanSig,
  createResponseSig
}