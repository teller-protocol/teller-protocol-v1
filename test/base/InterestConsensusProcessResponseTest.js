const withData = require('leche').withData;
const {
    t,
    getLatestTimestamp,
    THIRTY_DAYS,
    ONE_DAY
} = require('../utils/consts');
const { createInterestRequest, createUnsignedInterestResponse } = require('../utils/structs');
const { createInterestResponseSig, hashInterestRequest } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util')
const { interestConsensus } = require('../utils/events');

// Smart contracts
const InterestConsensusMock = artifacts.require("./mock/base/InterestConsensusMock.sol");


contract('InterestConsensusProcessResponseTest', function (accounts) {
    let instance
    const lendersContract = accounts[1]
    const nodeAddress = accounts[2]
    const submissions = 5
  const tolerance = 0
    const endTime = 34567
    const lender = accounts[3]

    const interestRequest = createInterestRequest(lender, 23456, endTime, 45678)

    const requestHash = ethUtil.bufferToHex(hashInterestRequest(interestRequest, lendersContract))

    withData({
        _1_signer_already_submitted: [   // signer already submitted for this loan
            3600, 3, true, false, false, true, 1, 3600, 3600, 3600, true, 'SIGNER_ALREADY_SUBMITTED'
        ],
        _2_signer_nonce_taken: [         // signer nonce is taken already
            3600, 3, true, false, true, false, 1, 3600, 3600, 3600, true, 'SIGNER_NONCE_TAKEN'
        ],
        _3_response_expired: [           // mock an expired response time
            3600, 3, true, true, false, false, 1, 3600, 3600, 3600, true, 'RESPONSE_EXPIRED'
        ],
        _4_signature_invalid: [           // mock the node not being authorized
            3600, 3, false, false, false, false, 1, 3600, 3600, 3600, true, 'SIGNATURE_INVALID'
        ],
        _5_first_valid_submission: [      // mock the first valid submission
            3600, 3, true, false, false, false, 0, 0, 0, 0, false, undefined
        ],
        _6_later_valid_submission: [      // mock a later submission
            4016, 3, true, false, false, false, 6, 4015, 3123, 21282, false, undefined
        ],
    }, function(
        interest,
        signerNonce,
        nodeIsSignerRole,
        mockExpiredResponse,
        mockSignerNonceTaken,
        mockHasSubmitted,
        mockTotalSubmissions,
        mockMaxValue,
        mockMinValue,
        mockSumOfValues,
        mustFail,
        expectedErrorMessage,
    ) {    
        it(t('user', 'new', 'Should accept/not accept a nodes response', false), async function() {
            // set up contract
            instance = await InterestConsensusMock.new()
            await instance.initialize(lendersContract, submissions, tolerance, THIRTY_DAYS)

            const currentTime = await getLatestTimestamp()
            const responseTime = mockExpiredResponse ?
                currentTime - THIRTY_DAYS - ONE_DAY :   // thirty one days ago
                currentTime - THIRTY_DAYS + ONE_DAY     // twenty nine days ago

            // mock data for the test
            if (nodeIsSignerRole) {
                await instance.addSigner(nodeAddress)
            }
            await instance.mockHasSubmitted(nodeAddress, lender, endTime, mockHasSubmitted)
            await instance.mockSignerNonce(nodeAddress, signerNonce, mockSignerNonceTaken)
            await instance.mockInterestSubmissions(
                lender,
                endTime,
                mockTotalSubmissions,
                mockMaxValue,
                mockMinValue,
                mockSumOfValues
            )

            let interestResponse = createUnsignedInterestResponse(nodeAddress, responseTime, interest, signerNonce)
            interestResponse = await createInterestResponseSig(web3, nodeAddress, interestResponse, requestHash)

            try {
                const result = await instance.externalProcessResponse(
                    interestRequest,
                    interestResponse,
                    requestHash
                );

                assert(!mustFail, 'It should have failed because data is invalid.');

                interestConsensus
                    .interestSubmitted(result)
                    .emitted(nodeAddress, lender, endTime, interest);

                let submission = await instance.interestSubmissions.call(lender, endTime)

                if (mockTotalSubmissions == 0) {
                    assert(submission['length'].toNumber(), 1, 'Total submissions incorrect')
                    assert(submission['min'].toNumber(), interest, 'Min incorrect')
                    assert(submission['max'].toNumber(), interest, 'Max incorrect')
                    assert(submission['sum'].toNumber(), interest, 'Sum incorrect')
                } else {
                    const newMin = interest < mockMinValue ? interest : mockMinValue
                    const newMax = interest < mockMaxValue ? interest : mockMaxValue
                    const newSum = mockSumOfValues + interest
                    const newTotal = mockTotalSubmissions + 1

                    assert(submission['length'].toNumber(), newTotal, 'Total submissions incorrect')
                    assert(submission['min'].toNumber(), newMin, 'Min incorrect')
                    assert(submission['max'].toNumber(), newMax, 'Max incorrect')
                    assert(submission['sum'].toNumber(), newSum, 'Sum incorrect')
                }
            } catch (error) {
                assert(mustFail, 'Should not have failed');
                assert.equal(error.reason, expectedErrorMessage);
            }
        })
    })
})