// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { hashInterestRequest, hashInterestResponse, hashLoanTermsRequest, hashLoanTermsResponse } = require('../utils/hashes');
const { createInterestRequest, createUnsignedInterestResponse, createLoanRequest, createUnsignedLoanResponse } = require('../utils/structs');
const ethUtil = require('ethereumjs-util')

// Smart contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const SignatureLibMock = artifacts.require("./mock/util/SignatureLibMock.sol");

// constants
const { NULL_ADDRESS } = require('../utils/consts');
const chains = require('../utils/chains');

contract('SignatureLibTest', function (accounts) {
    const lendersAddress = accounts[3];
    const loansAddress = accounts[4];
    let consensusInstance;
    let instance;

    beforeEach('Setup for each test', async () => {
        instance = await SignatureLibMock.new();
        consensusInstance = await Mock.new();
    });

    withData({
        _1_first_test_hashInterestRequest: [chains.mainnet, accounts[2], 234764, 344673177, 34467317723],
        _2_first_test_hashInterestRequest: [chains.ropsten, accounts[3], 134764, 354673177, 37467617723],
        _3_second_test_hashInterestRequest: [chains.ropsten, NULL_ADDRESS, 0, 0, 0],
    }, function(
            chainId,
            lender,
            startTime,
            endTime,
            requestTime,
        ) {
        it(t('user', 'addSignature', 'Should be able to hash a request and response', false), async function() {
            const request = createInterestRequest(lender, startTime, endTime, requestTime, instance.address, chains.mainnet);

            let expectedResult = ethUtil.bufferToHex(
                hashInterestRequest(
                    request,
                    lendersAddress,
                    chainId,
                )
            )

            // Get hash
            await instance.mockChainId(chainId)
            await instance.setInterestReqHash(request, lendersAddress);
            const result = await instance.getHashedInterestRequest(request);
            
            assert.equal(
                result,
                expectedResult,
                'Result should habe been ' + expectedResult
            );

        });
    });

    withData({
        _4_first_test_hashInterestResponse: [chains.mainnet, accounts[0], 234764, 344673177, 34467317723],
        _5_first_test_hashInterestResponse: [chains.ropsten, accounts[4], 765189, 344673177, 34657317723],
        _6_second_test_hashInterestResponse: [chains.mainnet, NULL_ADDRESS, 0, 0, 0],
    }, function(
        chainId,
        signer,
        responseTime,
        interest,
        signerNonce,
    ) {    
        it(t('user', 'new', 'Should correctly calculate the hash for a response', false), async function() {
            const request = createInterestRequest(accounts[3], 2345, 2345, 3456, instance.address)
            const requestHash = ethUtil.bufferToHex(hashInterestRequest(request, accounts[4], chainId))
            const response = createUnsignedInterestResponse(signer, responseTime, interest, signerNonce, instance.address)

            const expectedHash = ethUtil.bufferToHex(
                hashInterestResponse(
                    response,
                    requestHash,
                    chainId,
                )
            )

            // Invocation
            await instance.mockChainId(chainId);
            await instance.setInterestReqHash(request, accounts[4]);
            await instance.setHashInterestResponse(response);
            const result = await instance.getHashInterestResponse(response);

            assert.equal(
                result,
                expectedHash,
                'Result should have been ' + expectedHash
                );
        });
    });

    withData({
        _7_mainnet_first_test_hashLoanRequest: [chains.mainnet, accounts[2], accounts[1], 234764, 344673177, 34467317723, 234534],
        _8_ropsten_test_hashLoanRequest: [chains.ropsten, accounts[3], accounts[4], 254864, 345673177, 34467317723, 234534],
        _9_second_test_hashLoanRequest: [chains.mainnet, NULL_ADDRESS, NULL_ADDRESS, 0, 0, 0, 0],
    }, function(
        chainId,
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
                    loansAddress,
                    chainId,
                )
            );

            // Invocation
            await instance.mockChainId(chainId);
            await instance.setLoanRequestHash(request, loansAddress);
            const result = await instance.getHashedLoanRequest(request);

            assert.equal(
                result,
                expectedResult,
                'Result should have been ' + expectedResult
                );
        });
    });

    withData({
        _10_first_test_hashResponse: [chains.mainnet, accounts[2], 34552, 234764, 344673177, 34467317723, 345345, 34],
        _11_second_test_hashResponse: [chains.mainnet, NULL_ADDRESS, 0, 0, 0, 0, 0],
    }, function(
        chainId,
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
            const requestHash = ethUtil.bufferToHex(hashLoanTermsRequest(request, accounts[4], chainId))

            const expectedHash = ethUtil.bufferToHex(
                hashLoanTermsResponse(
                    response,
                    requestHash,
                    chainId,
                )
            )

            // Invocation
            await instance.mockChainId(chainId);
            await instance.setLoanRequestHash(request, loansAddress);
            await instance.setHashLoanResponse(response);
            const result = await instance.getHashedLoanResponse(response);

            assert.equal(
                result,
                expectedHash,
                'Result should have been ' + expectedHash
                );
        });
    });
    
});