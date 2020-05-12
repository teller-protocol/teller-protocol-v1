const withData = require('leche').withData;
const { 
    t,
    getLatestTimestamp,
    ONE_DAY,
    createInterestRequest,
    createUnsignedResponse,
    THIRTY_DAYS
} = require('../utils/consts');
const { createResponseSig, hashRequest } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util')
const { interestConsensus } = require('../utils/events');

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const InterestConsensus = artifacts.require("./mock/base/InterestConsensus.sol");


contract('InterestConsensusProcessRequestTest', function (accounts) {
    let instance
    const lendersContract = accounts[1]
    const nodeOne = accounts[2]
    const nodeTwo = accounts[3]
    const nodeThree = accounts[4]
    const nodeFour = accounts[5]
    const lender = accounts[9]
    const endTime = 34567

    let currentTime

    const interestRequest = createInterestRequest(lender, 23456, endTime, 45678)

    const requestHash = ethUtil.bufferToHex(hashRequest(interestRequest, lendersContract))

    let responseOne = createUnsignedResponse(nodeOne, 0, 35976, 0)

    let responseTwo = createUnsignedResponse(nodeTwo, 0, 34732, 4)

    let responseThree = createUnsignedResponse(nodeThree, 0, 34732, 4)

    let responseFour = createUnsignedResponse(nodeFour, 0, 34000, 0)

    let responseFive = createUnsignedResponse(nodeThree, 0, 34736, 1)

    before('Setup the response times and signatures', async () => {
        currentTime = await getLatestTimestamp()

        responseOne.responseTime = currentTime - (2 * ONE_DAY)
        responseTwo.responseTime = currentTime - (25 * ONE_DAY)
        responseThree.responseTime = currentTime - (29 * ONE_DAY)
        responseFour.responseTime = currentTime - ONE_DAY
        responseFive.responseTime = currentTime - (15 * ONE_DAY)

        responseOne = await createResponseSig(web3, nodeOne, responseOne, requestHash)
        responseTwo = await createResponseSig(web3, nodeTwo, responseTwo, requestHash)
        responseThree = await createResponseSig(web3, nodeThree, responseThree, requestHash)
        responseFour = await createResponseSig(web3, nodeFour, responseFour, requestHash)
        responseFive = await createResponseSig(web3, nodeThree, responseFive, requestHash)
    })

    withData({
        _1_insufficient_responses: [
            3, 320, [responseOne, responseTwo], false, true, 'INSUFFICIENT_RESPONSES'
        ],
        _2_one_response_successful: [
            1, 320, [responseOne], false, false, undefined
        ],
        _3_responses_just_over_tolerance: [  // average = 34860, tolerance = 1115, max is 35976 (1 too much)
            4, 320, [responseOne, responseTwo, responseThree, responseFour], false, true, 'RESPONSES_TOO_VARIED'
        ],
        _4_responses_just_within_tolerance: [  // average = 34861, tolerance = 1115, max is 35976 (perfect)
            4, 320, [responseOne, responseTwo, responseFour, responseFive], false, false, undefined
        ],
        _5_zero_tolerance: [
            1, 0, [responseTwo, responseThree], false, false, undefined
        ],
        _6_two_responses_same_signer: [     // responseThree and five have the same signer
            4, 320, [responseOne, responseThree, responseTwo, responseFive], false, true, 'SIGNER_ALREADY_SUBMITTED'
        ],
        _7_expired_response: [    // same as test 4, but expiring one response
            4, 320, [responseOne, responseTwo, responseFour, responseFive], true, true, 'RESPONSE_EXPIRED'
        ],
    }, function(
        reqSubmissions,
        tolerance,
        responses,
        expireResponse,
        mustFail,
        expectedErrorMessage,
    ) {    
        it(t('user', 'new', 'Should accept/not accept a nodes response', false), async function() {
            // set up contract
            const settings = await Settings.new(reqSubmissions, tolerance, THIRTY_DAYS);
            instance = await InterestConsensus.new();
            await instance.initialize(lendersContract, settings.address);

            await instance.addSigner(nodeOne)
            await instance.addSigner(nodeTwo)
            await instance.addSigner(nodeThree)
            await instance.addSigner(nodeFour)

            if (expireResponse) {
                responses[2].responseTime = currentTime - (30 * ONE_DAY)
            }

            try {
                const result = await instance.processRequest(
                    interestRequest,
                    responses, {
                       from: lendersContract
                    }
                );

                assert(!mustFail, 'It should have failed because data is invalid.');

                let totalInterest = 0

                responses.forEach(response => {
                    interestConsensus
                        .interestSubmitted(result)
                        .emitted(response.signer, lender, endTime, response.interest);

                    totalInterest += response.interest;
                })

                interestConsensus
                    .interestAccepted(result)
                    .emitted(lender, endTime, Math.floor(totalInterest / responses.length))


              
            } catch (error) {
                if (!mustFail) console.log(error)
                assert(mustFail, 'Should not have failed');
                assert.equal(error.reason, expectedErrorMessage);
            }
        })
    })
})