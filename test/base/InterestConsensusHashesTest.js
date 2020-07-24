// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { hashInterestRequest, hashInterestResponse } = require('../utils/hashes');
const { createInterestRequest, createUnsignedInterestResponse } = require('../utils/structs');
const ethUtil = require('ethereumjs-util')

// Smart contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const InterestConsensusMock = artifacts.require("./mock/base/InterestConsensusMock.sol");

// constants
const { NULL_ADDRESS } = require('../utils/consts');
const chains = require('../utils/chains');

contract('InterestConsensus hashInterestRequest and hashReponse', function (accounts) {
    const lendersAddress = accounts[3]
    let instance

    beforeEach('Setup for each test', async () => {
        const settings = await Mock.new();
        instance = await InterestConsensusMock.new()
        await instance.initialize(lendersAddress, settings.address);
    })

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
        it(t('user', 'new', 'Should correctly calculate the hash for a request', false), async function() {
            const request = createInterestRequest(lender, startTime, endTime, requestTime, instance.address, chains.mainnet)

            let expectedResult = ethUtil.bufferToHex(
                hashInterestRequest(
                    request,
                    lendersAddress,
                    chainId,
                )
            )
            await instance.mockChainId(chainId)

            // Invocation
            const result = await instance.externalHashRequest(request);

            assert.equal(result, expectedResult, 'Result should have been ' + expectedResult);
        });
    });

    withData({
        _1_first_test_hashInterestResponse: [chains.mainnet, accounts[0], 234764, 344673177, 34467317723],
        _2_first_test_hashInterestResponse: [chains.ropsten, accounts[4], 765189, 344673177, 34657317723],
        _3_second_test_hashInterestResponse: [chains.mainnet, NULL_ADDRESS, 0, 0, 0],
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
            await instance.mockChainId(chainId)

            // Invocation
            const result = await instance.externalHashResponse(response, requestHash);

            assert.equal(result, expectedHash, 'Result should have been ' + expectedHash);
        });
    }); 
});