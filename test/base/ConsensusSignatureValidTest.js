// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { hashInterestRequest, signHash } = require('../utils/hashes');

// Smart contracts
const ConsensusMock = artifacts.require("./mock/base/ConsensusMock.sol");

// constants
const { NULL_ADDRESS } = require('../utils/consts');

contract('ConsensusSignatureValidTest', function (accounts) {
    const tolerance = 0
    const submissions = 1
    let instance

    const hashOne = hashInterestRequest(
        {
            lender: accounts[2],
            startTime: 345,
            endTime: 736,
            requestTime: 0,
            consensusAddress: accounts[1],
        },
        accounts[1]
    )
    const hashTwo = hashInterestRequest(
        {
            lender: NULL_ADDRESS,
            startTime: 0,
            endTime: 0,
            requestTime: 0,
            consensusAddress: accounts[2],
        },
        NULL_ADDRESS
  )

    beforeEach('Setup for each test', async () => {
        instance = await ConsensusMock.new(submissions, tolerance)
    })

    withData({
        _1_hash1_signer_incorrect: [hashOne, hashOne, accounts[3], accounts[4], false, false, true],
        _2_hash1_signer_correct: [hashOne, hashOne, accounts[3], accounts[3], false, true, true],
        _3_hash1_r_s_swapped: [hashOne, hashOne, accounts[3], accounts[3], true, false, true],
        _4_hash2_signer_incorrect: [hashTwo, hashTwo, accounts[1], accounts[2], false, false, true],
        _5_hash2_signer_correct: [hashTwo, hashTwo, accounts[1], accounts[1], false, true, true],
        _6_hash2_send_wrong_hash: [hashTwo, hashOne, accounts[1], accounts[1], false, false, true],
        _7_hash2_signer_not_signer_role: [hashTwo, hashTwo, accounts[1], accounts[1], false, false, false],
    }, function(
        hashToSign,
        hashToSend,
        signer,
        expectedSigner,
        swapRandS,
        expectedResult,
        signerIsSignerRole,
    ) {    
        it(t('user', 'new', 'Should return false if numbers are out of range', false), async function() {
            const signature = await signHash(web3, signer, hashToSign)

            if (signerIsSignerRole) {
                await instance.addSigner(signer)
            }

            if (swapRandS) {
                const r = signature.r
                signature.r = signature.s
                signature.s = r
            }

            // Invocation
            const result = await instance.externalSignatureValid(
                {
                    signerNonce: 1,
                    v: signature.v,
                    r: signature.r,
                    s: signature.s
                },
                hashToSend,
                expectedSigner
            );

            assert.equal(result, expectedResult, 'Result should have been ' + expectedResult);
        });
    });
});