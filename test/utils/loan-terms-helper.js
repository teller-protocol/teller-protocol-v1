const ethUtil = require('ethereumjs-util');
const assert = require('assert');
const { createLoanRequest, createUnsignedLoanResponse } = require('./structs');
const { createLoanResponseSig, hashLoanTermsRequest } = require('./hashes');

const createSignedLoanTermsResponse = async (
  web3,
  loanTermsRequest,
  loanTermsResponseInfo,
  chainId
) => {
  const { requestHash } = loanTermsRequest;
  const unsignedLoanTermsResponse = createUnsignedLoanResponse(
    loanTermsResponseInfo.signer,
    loanTermsResponseInfo.responseTime,
    loanTermsResponseInfo.interestRate,
    loanTermsResponseInfo.collateralRatio,
    loanTermsResponseInfo.maxLoanAmount,
    loanTermsResponseInfo.signerNonce,
    loanTermsResponseInfo.consensusAddress
  );

  const signedResponse = await createLoanResponseSig(
    web3,
    unsignedLoanTermsResponse.signer,
    unsignedLoanTermsResponse,
    requestHash,
    chainId
  );

  return signedResponse;
};

module.exports = {
  createLoanTermsRequest: (loanRequestInfo, chainId) => {
    const loanTermsRequest = createLoanRequest(
      loanRequestInfo.borrower,
      loanRequestInfo.recipient,
      loanRequestInfo.requestNonce,
      loanRequestInfo.amount,
      loanRequestInfo.duration,
      loanRequestInfo.requestTime,
      loanRequestInfo.consensusAddress
    );
    let requestHash = hashLoanTermsRequest(
      loanTermsRequest,
      loanRequestInfo.caller,
      chainId
    );
    requestHash = ethUtil.bufferToHex(requestHash);
    return {
      loanTermsRequest,
      requestHash,
    };
  },
  createSignedLoanTermsResponse,
  /*
        const loanResponseInfoTemplate = {
            responseTime: Math.round(Date.now() / 1000) - 100,
            interestRate: 4000,
            collateralRatio: 6000,
            maxLoanAmount: 20000,
            consensusAddress: 0x1234...,
            signerNonce, // signerNonce is not provided in template
            signer, // signer is not provided in template
        };
    */
  createMultipleSignedLoanTermsResponses: async (
    web3,
    loanTermsRequest,
    signers,
    loanResponseInfoTemplate,
    nonces,
    chainId
  ) => {
    assert(signers && signers.length > 0, 'Requires at least one signer.');
    const signedLoanTermsResponses = [];
    for (const signer of signers) {
      const loanResponseInfo = {
        ...loanResponseInfoTemplate,
        signer: signer,
        signerNonce: nonces.newNonce(signer),
      };
      const signedResponse = await createSignedLoanTermsResponse(
        web3,
        loanTermsRequest,
        loanResponseInfo,
        chainId
      );
      signedLoanTermsResponses.push(signedResponse);
    }
    return signedLoanTermsResponses;
  },
};
