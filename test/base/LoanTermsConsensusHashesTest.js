// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { hashLoanTermsRequest, hashLoanTermsResponse } = require('../utils/hashes');
const { createLoanRequest, createUnsignedLoanResponse } = require('../utils/structs');
const ethUtil = require('ethereumjs-util')

// Smart contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const LoanTermsConsensusMock = artifacts.require("./mock/base/LoanTermsConsensusMock.sol");

// constants
const { NULL_ADDRESS } = require('../utils/consts');

contract('LoanTermsConsensus hashRequest and hashReponse', function (accounts) {
    const loansAddress = accounts[3]
    let instance
    let consensusInstance;

    beforeEach('Setup for each test', async () => {
        const settingsInstance = await Mock.new();
        consensusInstance = await Mock.new();
        instance = await LoanTermsConsensusMock.new()
        await instance.initialize(loansAddress, settingsInstance.address)
    })

    withData({
        _1_first_test_hashRequest: [accounts[2], accounts[1], 234764, 344673177, 34467317723, 234534],
        _2_second_test_hashRequest: [NULL_ADDRESS, NULL_ADDRESS, 0, 0, 0, 0],
    }, function(
        borrower,
        recipient,
        requestNonce,
        amount,
        duration,
        requestTime,
    ) {    
        it(t('user', 'hashRequest', 'Should correctly calculate the hash for a request', false), async function() {
            const request = createLoanRequest(borrower, recipient, requestNonce, amount, duration, requestTime, instance.address)
            let expectedResult = ethUtil.bufferToHex(
                hashLoanTermsRequest(
                    request,
                    loansAddress
                )
            )

            // Invocation
            const result = await instance.externalHashRequest(request)

            assert.equal(result, expectedResult, 'Result should have been ' + expectedResult);
        });
    });

    withData({
        _1_first_test_hashResponse: [accounts[2], 34552, 234764, 344673177, 34467317723, 345345, 34],
        _2_second_test_hashResponse: [NULL_ADDRESS, 0, 0, 0, 0, 0],
    }, function(
        signer,
        responseTime,
        interestRate,
        collateralRatio,
        maxLoanAmount,
        signerNonce,
    ) {    
        it(t('user', 'hashResponse', 'Should correctly calculate the hash for a response', false), async function() {
            const response = createUnsignedLoanResponse(signer, responseTime, interestRate, collateralRatio, maxLoanAmount, signerNonce, instance.address)
            const request = createLoanRequest(NULL_ADDRESS, NULL_ADDRESS, 52345, 2345234, 234534, 34534, consensusInstance.address)
            const requestHash = ethUtil.bufferToHex(hashLoanTermsRequest(request, accounts[4]))

            const expectedHash = ethUtil.bufferToHex(
                hashLoanTermsResponse(
                    response,
                    requestHash
                )
            )

            // Invocation
            const result = await instance.externalHashResponse.call(
              response,
                requestHash
            );

            assert.equal(result, expectedHash, 'Result should have been ' + expectedHash);
        });
    }); 
});