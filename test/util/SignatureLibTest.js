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

contract('SignatureLibTest', function (accounts) {
    const lendersAddress = accounts[3]
    let instance;

    beforeEach('Setup for each test', async () => {
        instance = await SignatureLibMock.new();
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
            await instance.setInterestReqHash(request, lendersAddress, chainId);
            const result = await instance.getHashedInterestRequest(request);
            
            assert.equal(
                result,
                expectedResult,
                'Result should habe been ' + expectedResult,
                ' Was...' + result
            );

        });
    });
});