// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { hashRequest, signHash } = require('../utils/hashes');

// Smart contracts
const ConsensusMock = artifacts.require("./mock/base/ConsensusMock.sol");

// constants
const { NULL_ADDRESS } = require('../utils/consts');

contract('ConsensusSignatureValidTest', function (accounts) {
    const tolerance = 0
    const submissions = 1
    let instance

    const hashOne = hashRequest(
        {
            lender: accounts[2],
            startTime: 345,
            endTime: 736,
            requestTime: 0,
        },
        accounts[1]
    )
    const hashTwo = hashRequest(
        {
            lender: NULL_ADDRESS,
            startTime: 0,
            endTime: 0,
            requestTime: 0,
        },
        NULL_ADDRESS
  )

    beforeEach('Setup for each test', async () => {
        instance = await ConsensusMock.new(submissions, tolerance)
    })

    withData({
        _1_hash1_signer_incorrect: [hashOne, hashOne, accounts[3], accounts[4], false, false],
        _2_hash1_signer_correct: [hashOne, hashOne, accounts[3], accounts[3], false, true],
        _3_hash1_r_s_swapped: [hashOne, hashOne, accounts[3], accounts[3], true, false],
        _4_hash2_signer_incorrect: [hashTwo, hashTwo, accounts[1], accounts[2], false, false],
        _5_hash2_signer_correct: [hashTwo, hashTwo, accounts[1], accounts[1], false, true],
        _6_hash2_send_wrong_hash: [hashTwo, hashOne, accounts[1], accounts[1], false, false],
    }, function(
        hashToSign,
        hashToSend,
        signer,
        msgSender,
        swapRandS,
        expectedResult,
    ) {    
        it(t('user', 'new', 'Should return false if numbers are out of range', false), async function() {
            const signature = await signHash(web3, signer, hashToSign)

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
                {
                    from: msgSender
                }
            );

            assert.equal(result, expectedResult, 'Result should have been ' + expectedResult);
        });
    });
});