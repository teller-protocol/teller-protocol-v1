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

function hashInterestResponse(response, requestHash) {
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

function hashInterestRequest(request, caller) {
  return ethUtil.keccak256(
    abi.rawEncode(
      ['address', 'address', 'uint256', 'uint256', 'uint256'],
      [
        caller,
        request.lender,
        request.startTime,
        request.endTime,
        request.requestTime
      ]
    )
  )
}


function hashLoanTermsResponse(response, requestHash) {
  return ethUtil.keccak256(
    abi.rawEncode(
      ['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
      [
        response.responseTime,
        response.interestRate,
        response.collateralRatio,
        response.maxLoanAmount,
        response.signature.signerNonce,
        requestHash
      ]
    )
  )
}

function hashLoanTermsRequest(request, caller) {
  return ethUtil.keccak256(
    abi.rawEncode(
      ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
      [
        caller,
        request.borrower,
        request.recipient,
        request.requestNonce,
        request.amount,
        request.duration,
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

async function createInterestResponseSig(web3, signer, interestResponse, requestHash) {
  const responseHash = hashInterestResponse(interestResponse, requestHash)
  const signature = await web3.eth.sign(ethUtil.bufferToHex(responseHash), signer);
  const { v, r, s } = ethUtil.fromRpcSig(signature)
  interestResponse.signature.v = String(v)
  interestResponse.signature.r = ethUtil.bufferToHex(r)
  interestResponse.signature.s = ethUtil.bufferToHex(s)
  return interestResponse
}

async function createLoanResponseSig(web3, signer, loanResponse, requestHash) {
  const responseHash = hashLoanTermsResponse(loanResponse, requestHash)
  const signature = await web3.eth.sign(ethUtil.bufferToHex(responseHash), signer);
  const { v, r, s } = ethUtil.fromRpcSig(signature)
  loanResponse.signature.v = String(v)
  loanResponse.signature.r = ethUtil.bufferToHex(r)
  loanResponse.signature.s = ethUtil.bufferToHex(s)
  return loanResponse
}

module.exports = {
  hashLoan,
  hashInterestRequest,
  hashInterestResponse,
  hashLoanTermsResponse,
  hashLoanTermsRequest,
  signHash,
  createInterestResponseSig,
  createLoanResponseSig
}