// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { hashInterestRequest, hashInterestResponse } = require('../utils/hashes');
const { createInterestRequest, createUnsignedInterestResponse } = require('../utils/structs');
const ethUtil = require('ethereumjs-util')

// Smart contracts
const SignatureLibMock = artifacts.require("./mock/util/SignatureLibMock.sol");

// constants
const { NULL_ADDRESS } = require('../utils/consts');
const chains = require('../utils/chains');

contract('SignatureLibHashInterestRequestTest', function (accounts) {
    const lendersAddress = accounts[3];
    let instance;

    beforeEach('Setup for each test', async () => {
        instance = await SignatureLibMock.new();
    });

    withData({
        _1_mainnet_test_hashInterestRequest: [chains.mainnet, 1, accounts[2], 234764, 344673177, 34467317723],
        _2_ropsten_first_test_hashInterestRequest: [chains.ropsten, 2,  accounts[3], 134764, 354673177, 37467617723],
        _3_ropsten_second_test_hashInterestRequest: [chains.ropsten, 3, NULL_ADDRESS, 0, 0, 0],
    }, function(
            chainId,
            requestNonce,
            lender,
            startTime,
            endTime,
            requestTime,
        ) {
        it(t('user', 'addSignature', 'Should be able to hash a request and response', false), async function() {
            const request = createInterestRequest(lender, requestNonce, startTime, endTime, requestTime, instance.address, chains.mainnet);

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
        _4_mainnet_test_hashInterestResponse: [chains.mainnet, 4, accounts[0], 234764, 344673177, 34467317723],
        _5_ropsten_first_test_hashInterestResponse: [chains.ropsten, 5, accounts[4], 765189, 344673177, 34657317723],
        _6_ropsten_second_test_hashInterestResponse: [chains.mainnet, 6, NULL_ADDRESS, 0, 0, 0],
    }, function(
        chainId,
        requestNonce,
        signer,
        responseTime,
        interest,
        signerNonce,
    ) {    
        it(t('user', 'new', 'Should correctly calculate the hash for a response', false), async function() {
            const request = createInterestRequest(accounts[3], requestNonce, 2345, 2345, 3456, instance.address)
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
});
