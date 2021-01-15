const ethUtil = require('ethereumjs-util');
const abi = require('ethereumjs-abi');

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
  );
}

function hashInterestResponse(response, requestHash, chainId) {
  return ethUtil.keccak256(
    abi.rawEncode(
      ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
      [
        response.consensusAddress,
        response.responseTime,
        response.interest,
        response.signature.signerNonce,
        chainId,
        requestHash,
      ]
    )
  );
}

function hashInterestRequest(request, caller, chainId) {
  return ethUtil.keccak256(
    abi.rawEncode(
      [
        'address',
        'address',
        'address',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
      ],
      [
        caller,
        request.lender,
        request.consensusAddress,
        request.requestNonce,
        request.startTime,
        request.endTime,
        request.requestTime,
        chainId,
      ]
    )
  );
}

function hashLoanTermsResponse(response, requestHash, chainId) {
  return ethUtil.keccak256(
    abi.rawEncode(
      [
        'address',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'bytes32',
      ],
      [
        response.consensusAddress,
        response.responseTime,
        response.interestRate,
        response.collateralRatio,
        response.maxLoanAmount,
        response.signature.signerNonce,
        chainId,
        requestHash,
      ]
    )
  );
}

function hashLoanTermsRequest(request, caller, chainId) {
  return ethUtil.keccak256(
    abi.rawEncode(
      [
        'address',
        'address',
        'address',
        'address',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
      ],
      [
        caller,
        request.borrower,
        request.recipient,
        request.consensusAddress,
        request.requestNonce,
        request.amount,
        request.duration,
        request.requestTime,
        chainId,
      ]
    )
  );
}

async function signHash(web3, signer, hash) {
  const signature = await web3.eth.sign(ethUtil.bufferToHex(hash), signer);
  const { v, r, s } = ethUtil.fromRpcSig(signature);
  return {
    v: String(v),
    r: ethUtil.bufferToHex(r),
    s: ethUtil.bufferToHex(s),
  };
}

async function createInterestResponseSig(
  web3,
  signer,
  interestResponse,
  requestHash,
  chainId
) {
  const responseHash = hashInterestResponse(interestResponse, requestHash, chainId);
  const signature = await web3.eth.sign(ethUtil.bufferToHex(responseHash), signer);
  const { v, r, s } = ethUtil.fromRpcSig(signature);
  interestResponse.signature.v = String(v);
  interestResponse.signature.r = ethUtil.bufferToHex(r);
  interestResponse.signature.s = ethUtil.bufferToHex(s);
  return interestResponse;
}

async function createLoanResponseSig(web3, signer, loanResponse, requestHash, chainId) {
  const responseHash = hashLoanTermsResponse(loanResponse, requestHash, chainId);
  const signature = await web3.eth.sign(ethUtil.bufferToHex(responseHash), signer);
  const { v, r, s } = ethUtil.fromRpcSig(signature);
  loanResponse.signature.v = String(v);
  loanResponse.signature.r = ethUtil.bufferToHex(r);
  loanResponse.signature.s = ethUtil.bufferToHex(s);
  return loanResponse;
}

module.exports = {
  hashLoan,
  hashInterestRequest,
  hashInterestResponse,
  hashLoanTermsResponse,
  hashLoanTermsRequest,
  signHash,
  createInterestResponseSig,
  createLoanResponseSig,
};
