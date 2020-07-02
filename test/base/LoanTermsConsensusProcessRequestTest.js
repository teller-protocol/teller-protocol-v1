const withData = require('leche').withData;
const { 
    t,
    getLatestTimestamp,
    ONE_DAY,
    THIRTY_DAYS,
    NULL_ADDRESS
} = require('../utils/consts');
const { createLoanRequest, createUnsignedLoanResponse } = require('../utils/structs');
const { createLoanResponseSig, hashLoanTermsRequest } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util')
const { loanTermsConsensus } = require('../utils/events');

const BigNumber = require('bignumber.js');

// Smart contracts
const LoanTermsConsensus = artifacts.require("./mock/base/LoanTermsConsensusMock.sol");
const Settings = artifacts.require("./base/Settings.sol");


contract('LoanTermsConsensusProcessRequestTest', function (accounts) {
    let instance
    let settings

    const loansContract = accounts[1]
    const nodeOne = accounts[2]
    const nodeTwo = accounts[3]
    const nodeThree = accounts[4]
    const nodeFour = accounts[5]
    const borrower = accounts[9]
    const requestNonce = 142

    let currentTime

    const loanRequest = createLoanRequest(borrower, NULL_ADDRESS, requestNonce, 15029398, THIRTY_DAYS, 45612478)
    const requestHash = ethUtil.bufferToHex(hashLoanTermsRequest(loanRequest, loansContract))

    let responseOne = createUnsignedLoanResponse(nodeOne, 0, 1350, 6834, BigNumber("90000000000000000000000").toFixed(), 0)

    let responseTwo = createUnsignedLoanResponse(nodeTwo, 0, 1376, 6666, BigNumber("91500000000000000000000").toFixed(), 0)

    let responseThree = createUnsignedLoanResponse(nodeThree, 0, 1376, 6666, BigNumber("91500000000000000000000").toFixed(), 4)

    let responseFour = createUnsignedLoanResponse(nodeFour, 0, 1398, 7040, BigNumber("92500000000000000000000").toFixed(), 0)

    let responseFive = createUnsignedLoanResponse(nodeThree, 0, 1400, 6840, BigNumber("94000000000000000000000").toFixed(), 0)

    before('Setup the response times and signatures', async () => {
        currentTime = await getLatestTimestamp()

        responseOne.responseTime = currentTime - (2 * ONE_DAY)
        responseTwo.responseTime = currentTime - (25 * ONE_DAY)
        responseThree.responseTime = currentTime - (29 * ONE_DAY)
        responseFour.responseTime = currentTime - ONE_DAY
        responseFive.responseTime = currentTime - (15 * ONE_DAY)

        responseOne = await createLoanResponseSig(web3, nodeOne, responseOne, requestHash)
        responseTwo = await createLoanResponseSig(web3, nodeTwo, responseTwo, requestHash)
        responseThree = await createLoanResponseSig(web3, nodeThree, responseThree, requestHash)
        responseFour = await createLoanResponseSig(web3, nodeFour, responseFour, requestHash)
        responseFive = await createLoanResponseSig(web3, nodeThree, responseFive, requestHash)
    })

    withData({
        _1_insufficient_responses: [
            3, 320, undefined, [responseOne, responseTwo], false, true, 'INSUFFICIENT_RESPONSES'
        ],
        _2_one_response_successful: [
            1, 320, undefined, [responseOne], false, false, undefined
        ],
        _3_responses_just_over_tolerance: [  
            4, 310, undefined, [responseOne, responseTwo, responseThree, responseFour], false, true, 'RESPONSES_TOO_VARIED'
        ],
        _4_responses_just_within_tolerance: [
            4, 320, undefined, [responseOne, responseTwo, responseFour, responseFive], false, false, undefined
        ],
        _5_zero_tolerance: [
            1, 0, undefined, [responseTwo, responseThree], false, false, undefined
        ],
        _6_two_responses_same_signer: [     // responseThree and five have the same signer
            4, 320, undefined, [responseOne, responseThree, responseTwo, responseFive], false, true, 'SIGNER_ALREADY_SUBMITTED'
        ],
        _7_expired_response: [    // same as test 4, but expiring one response
            4, 320, undefined, [responseOne, responseTwo, responseFour, responseFive], true, true, 'RESPONSE_EXPIRED'
        ],
        _8_nonce_taken: [
            3, 320, { nonce: 0, signer: nodeOne }, [responseFive, responseOne, responseTwo], false, true, 'SIGNER_NONCE_TAKEN'
        ],
    }, function(
        reqSubmissions,
        tolerance,
        signerNonceTaken,
        responses,
        responseExpired,
        mustFail,
        expectedErrorMessage,
    ) {    
        it(t('user', 'new', 'Should accept/not accept a nodes response', mustFail), async function() {
            // set up contract
            settings = await Settings.new(reqSubmissions, tolerance, THIRTY_DAYS, 1, THIRTY_DAYS, 9500);
            instance = await LoanTermsConsensus.new()
            await instance.initialize(loansContract, settings.address)

            await instance.addSigner(nodeOne)
            await instance.addSigner(nodeTwo)
            await instance.addSigner(nodeThree)
            await instance.addSigner(nodeFour)
            if(signerNonceTaken !== undefined)  {
                await instance.mockSignerNonce(
                    signerNonceTaken.signer,
                    signerNonceTaken.nonce,
                    true
                );
            }

            if (responseExpired) {
                responses[2].responseTime = currentTime - (30 * ONE_DAY)
            }

            try {
                const result = await instance.processRequest(
                    loanRequest,
                    responses, {
                       from: loansContract
                    }
                );

                assert(!mustFail, 'It should have failed because data is invalid.');

                let totalInterestRate = 0
                let totalCollateralRatio = 0
                let totalMaxLoanAmount = BigNumber('0')

                responses.forEach(response => {
                    loanTermsConsensus
                        .termsSubmitted(result)
                        .emitted(
                            response.signer,
                            borrower,
                            requestNonce,
                            response.interestRate,
                            response.collateralRatio,
                            response.maxLoanAmount
                        );

                    totalInterestRate += response.interestRate;
                    totalCollateralRatio += response.collateralRatio;
                    totalMaxLoanAmount = totalMaxLoanAmount.plus(response.maxLoanAmount)
                })

                loanTermsConsensus
                    .termsAccepted(result)
                    .emitted(
                        borrower,
                        requestNonce,
                        Math.floor(totalInterestRate / responses.length),
                        Math.floor(totalCollateralRatio / responses.length),
                        totalMaxLoanAmount.div(responses.length).toFixed()
                    )
              
            } catch (error) {
                if(!mustFail) console.log(error)
                assert(mustFail, 'Should not have failed');
                assert.equal(error.reason, expectedErrorMessage);
            }
        })
    })
})