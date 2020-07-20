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
const chains = require('../utils/chains');

// Smart contracts
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");
const Settings = artifacts.require("./base/Settings.sol");


contract('LoanTermsConsensusProcessRequestTest', function (accounts) {
    let instance
    let settings
    const loansContract = accounts[1]
    const nodeOne = accounts[2]
    const nodeTwo = accounts[3]
    const nodeThree = accounts[4]
    const nodeFour = accounts[5]
    const nodeSix = accounts[6]
    const borrower = accounts[9]
    const requestNonce = 142

    let currentTime
    let loanRequest
    let responseOne = createUnsignedLoanResponse(nodeOne, 0, 1350, 6834, BigNumber("90000000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseTwo = createUnsignedLoanResponse(nodeTwo, 0, 1376, 6666, BigNumber("91500000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseThree = createUnsignedLoanResponse(nodeThree, 0, 1376, 6666, BigNumber("91500000000000000000000").toFixed(), 4, NULL_ADDRESS)
    let responseFour = createUnsignedLoanResponse(nodeFour, 0, 1398, 7040, BigNumber("92500000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseFive = createUnsignedLoanResponse(nodeThree, 0, 1400, 6840, BigNumber("94000000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseExpired = createUnsignedLoanResponse(nodeSix, 0, 1400, 6840, BigNumber("94000000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseInvalidChainId = createUnsignedLoanResponse(nodeThree, 0, 1400, 6840, BigNumber("94000000000000000000000").toFixed(), 3, NULL_ADDRESS)

    beforeEach('Setup the response times and signatures', async () => {
        instance = await LoanTermsConsensus.new()
        currentTime = await getLatestTimestamp()

        loanRequest = createLoanRequest(borrower, NULL_ADDRESS, requestNonce, 15029398, THIRTY_DAYS, 45612478, instance.address)

        responseOne.consensusAddress = instance.address;
        responseTwo.consensusAddress = instance.address;
        responseThree.consensusAddress = instance.address;
        responseFour.consensusAddress = instance.address;
        responseFive.consensusAddress = instance.address;
        responseExpired.consensusAddress = instance.address;
        responseInvalidChainId.consensusAddress = instance.address;

        responseOne.responseTime = currentTime - (2 * ONE_DAY)
        responseTwo.responseTime = currentTime - (25 * ONE_DAY)
        responseThree.responseTime = currentTime - (29 * ONE_DAY)
        responseFour.responseTime = currentTime - ONE_DAY
        responseFive.responseTime = currentTime - (15 * ONE_DAY)
        responseExpired.responseTime = currentTime - (31 * ONE_DAY)
        responseInvalidChainId.responseTime = currentTime - (15 * ONE_DAY)

        const chainId = chains.mainnet;
        const invalidChainId = chains.ropsten;
        const requestHash = ethUtil.bufferToHex(hashLoanTermsRequest(loanRequest, loansContract, chainId))

        responseOne = await createLoanResponseSig(web3, nodeOne, responseOne, requestHash, chainId)
        responseTwo = await createLoanResponseSig(web3, nodeTwo, responseTwo, requestHash, chainId)
        responseThree = await createLoanResponseSig(web3, nodeThree, responseThree, requestHash, chainId)
        responseFour = await createLoanResponseSig(web3, nodeFour, responseFour, requestHash, chainId)
        responseFive = await createLoanResponseSig(web3, nodeThree, responseFive, requestHash, chainId)
        responseExpired = await createLoanResponseSig(web3, nodeSix, responseExpired, requestHash, chainId)
        responseInvalidChainId = await createLoanResponseSig(web3, nodeThree, responseInvalidChainId, requestHash, invalidChainId)
    })

    withData({
        _1_insufficient_responses: [
            3, 320, [responseOne, responseTwo], true, 'INSUFFICIENT_RESPONSES'
        ],
        _2_one_response_successful: [
            1, 320, [responseOne], false, undefined
        ],
        _3_responses_just_over_tolerance: [  
            4, 310, [responseOne, responseTwo, responseThree, responseFour], true, 'RESPONSES_TOO_VARIED'
        ],
        _4_responses_just_within_tolerance: [
            4, 320, [responseOne, responseTwo, responseFour, responseFive], false, undefined
        ],
        _5_zero_tolerance: [
            1, 0, [responseTwo, responseThree], false, undefined
        ],
        _6_two_responses_same_signer: [     // responseThree and five have the same signer
            4, 320, [responseOne, responseThree, responseTwo, responseFive], true, 'SIGNER_ALREADY_SUBMITTED'
        ],
        _7_expired_response: [
            4, 320, [responseOne, responseTwo, responseExpired, responseFive], true, 'RESPONSE_EXPIRED'
        ],
        _8_responses_invalid_sig_chainid: [
            4, 320, [responseOne, responseTwo, responseFour, responseInvalidChainId], true, 'SIGNATURE_INVALID'
        ],
    }, function(
        reqSubmissions,
        tolerance,
        responses,
        mustFail,
        expectedErrorMessage,
    ) {    
        it(t('user', 'new', 'Should accept/not accept a nodes response', mustFail), async function() {
            // set up contract
            settings = await Settings.new(reqSubmissions, tolerance, THIRTY_DAYS, 1, THIRTY_DAYS, 9500);
            
            await instance.initialize(loansContract, settings.address)

            await instance.addSigner(nodeOne)
            await instance.addSigner(nodeTwo)
            await instance.addSigner(nodeThree)
            await instance.addSigner(nodeFour)
            await instance.addSigner(nodeSix)

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