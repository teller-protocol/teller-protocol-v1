// Smart contracts
const LoansInterface = artifacts.require("./interfaces/LoansInterface.sol");

// Util classes
const ethUtil = require('ethereumjs-util');
const { createLoanRequest, createUnsignedLoanResponse, } = require('../../test/utils/structs');
const assert = require('assert');
const { createLoanResponseSig, hashLoanTermsRequest } = require('../../test/utils/hashes');
const { NULL_ADDRESS, ONE_DAY } = require('../../test/utils/consts');
const ProcessArgs = require('../utils/ProcessArgs');
const processArgs = new ProcessArgs();

const createLoanTermsRequest = (loanRequestInfo) => {
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
}

const createSignedInterestResponse = async (web3, loanTermsRequest, loanTermsResponseInfo) => {
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

/** Process parameters: */
const tokenName = 'USDC';
const borrowerIndex = 1;
const recipientIndex = -1;
const durationInDays = 10;
const amount = 10000;
const collateralValue = 100000;
const nonce = 0;

module.exports = async (callback) => {
    try {
        const network = processArgs.network();
        console.log(`Script will be executed in network ${network}.`)
        const appConf = require('../../config')(network);
        const { zerocollateral, toTxUrl } = appConf.networkConfig;

        const loansAddress = zerocollateral[`Loans_z${tokenName}`];
        assert(loansAddress, "Loans address is undefined.");

        const accounts = await web3.eth.getAccounts();
        assert(accounts, "Accounts must be defined.");
        const borrower = accounts[borrowerIndex];
        assert(borrower, "Borrower must be defined.");
        const recipient = recipientIndex === -1 ? NULL_ADDRESS : accounts[recipientIndex];
        assert(recipient, "Recipient must be defined.");

        const loanTermsRequestInfo = {
            borrower,
            recipient,
            requestNonce: nonce,
            amount,
            duration: durationInDays * ONE_DAY,
            requestTime: Math.round(Date.now() / 1000),
            caller: loansAddress,
        };
        const loanTermsRequest = createLoanTermsRequest(loanTermsRequestInfo);

        const loanResponseInfo1 = {
            signer: accounts[9],
            responseTime: Math.round(Date.now() / 1000) - 10,
            interestRate: 4000,
            collateralRatio: 6000,
            maxLoanAmount: 20000,
            signerNonce: nonce
        };
        const signedResponse1 = await createSignedInterestResponse(web3, loanTermsRequest, loanResponseInfo1);
        
        const loanResponseInfo2 = {
            signer: accounts[10],
            responseTime: Math.round(Date.now() / 1000) - 100,
            interestRate: 4000,
            collateralRatio: 6000,
            maxLoanAmount: 20000,
            signerNonce: nonce
        };
        const signedResponse2 = await createSignedInterestResponse(web3, loanTermsRequest, loanResponseInfo2);
        
        const loansInstance = await LoansInterface.at(loansAddress);        

        const result = await loansInstance.setLoanTerms(
            loanTermsRequest.loanTermsRequest,
            [signedResponse1, signedResponse2],
            {
              from: borrower,
              value: collateralValue,
            }
        );
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};