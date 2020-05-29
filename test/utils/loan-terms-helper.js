const ethUtil = require('ethereumjs-util');
const assert = require('assert');
const { createLoanRequest, createUnsignedLoanResponse, } = require('./structs');
const { createLoanResponseSig, hashLoanTermsRequest } = require('./hashes');

const createSignedLoanTermsResponse = async (web3, loanTermsRequest, loanTermsResponseInfo) => {
    const { requestHash } = loanTermsRequest;
    const unsignedLoanTermsResponse = createUnsignedLoanResponse(
        loanTermsResponseInfo.signer,
        loanTermsResponseInfo.responseTime,
        loanTermsResponseInfo.interestRate,
        loanTermsResponseInfo.collateralRatio,
        loanTermsResponseInfo.maxLoanAmount,
        loanTermsResponseInfo.signerNonce
    );

    const signedResponse = await createLoanResponseSig(
        web3,
        unsignedLoanTermsResponse.signer,
        unsignedLoanTermsResponse,
        requestHash
    );

    return signedResponse;
};

module.exports = {
    createLoanTermsRequest: (loanRequestInfo) => {
        const loanTermsRequest = createLoanRequest(
            loanRequestInfo.borrower,
            loanRequestInfo.recipient,
            loanRequestInfo.requestNonce,
            loanRequestInfo.amount,
            loanRequestInfo.duration,
            loanRequestInfo.requestTime,
        );
        let requestHash = hashLoanTermsRequest(loanTermsRequest, loanRequestInfo.caller);
        requestHash = ethUtil.bufferToHex(requestHash);
        return {
            loanTermsRequest,
            requestHash,
        }
    },
    createSignedLoanTermsResponse,
    /*
        const loanResponseInfoTemplate = {
            responseTime: Math.round(Date.now() / 1000) - 100,
            interestRate: 4000,
            collateralRatio: 6000,
            maxLoanAmount: 20000,
            signerNonce, // signerNonce is not provided in template
            signer, // signer is not provided in template
        };
    */
    createMultipleSignedLoanTermsResponses: async (web3, loanTermsRequest, signers, loanResponseInfoTemplate, nonces) => {
        assert(signers && signers.length > 0, 'Requires at least one signer.');
        const signedLoanTermsResponses = [];
        for (const signer of signers) {
            const loanResponseInfo = {
                ...loanResponseInfoTemplate,
                signer: signer,
                signerNonce: nonces.newNonce(signer),
            };
            const signedResponse = await createSignedLoanTermsResponse(web3, loanTermsRequest, loanResponseInfo);
            signedLoanTermsResponses.push(signedResponse);
        }
        return signedLoanTermsResponses;
    },
};