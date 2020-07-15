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

const BigNumber = require('bignumber.js');

// Smart contracts
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");
const Settings = artifacts.require("./base/Settings.sol");


contract('EstimateGasLoanTermsConsensusProcessRequestTest', function (accounts) {
    let instance
    let settings

    const baseGasCost = 413814;
    const expectedGasCost = (responses) => baseGasCost + ((responses -  1) * 82600);

    const loansContract = accounts[1]
    const nodeOne = accounts[1]
    const nodeTwo = accounts[2]
    const nodeThree = accounts[3]
    const nodeFour = accounts[4]
    const nodeFive = accounts[5]
    const nodeSix = accounts[6]
    const nodeSeven = accounts[7]
    const nodeEight = accounts[8]
    const nodeNine = accounts[9]
    const borrower = accounts[0]
    const requestNonce = 142

    let currentTime

    const loanRequest = createLoanRequest(borrower, NULL_ADDRESS, requestNonce, 15029398, THIRTY_DAYS, 45612478)
    const requestHash = ethUtil.bufferToHex(hashLoanTermsRequest(loanRequest, loansContract))
    let responseOne = createUnsignedLoanResponse(nodeOne, 0, 1400, 6765, BigNumber("91500000000000000000000").toFixed(), 0)
    let responseTwo = createUnsignedLoanResponse(nodeTwo, 0, 1399, 6766, BigNumber("91500000000000000000000").toFixed(), 0)
    let responseThree = createUnsignedLoanResponse(nodeThree, 0, 1397, 6764, BigNumber("91500000000000000000000").toFixed(), 4)
    let responseFour = createUnsignedLoanResponse(nodeFour, 0, 1398, 6764, BigNumber("91500000000000000000000").toFixed(), 0)
    let responseFive = createUnsignedLoanResponse(nodeFive, 0, 1400, 6766, BigNumber("91500000000000000000000").toFixed(), 0)
    let responseSix = createUnsignedLoanResponse(nodeSix, 0, 1400, 6767, BigNumber("91500000000000000000000").toFixed(), 0)
    let responseSeven = createUnsignedLoanResponse(nodeSeven, 0, 1400, 6767, BigNumber("91500000000000000000000").toFixed(), 0)
    let responseEight = createUnsignedLoanResponse(nodeEight, 0, 1400, 6767, BigNumber("91500000000000000000000").toFixed(), 0)
    let responseNine = createUnsignedLoanResponse(nodeNine, 0, 1400, 6767, BigNumber("91500000000000000000000").toFixed(), 0)

    before('Setup the response times and signatures', async () => {
        currentTime = await getLatestTimestamp()

        responseOne.responseTime = currentTime - (2 * ONE_DAY)
        responseTwo.responseTime = currentTime - (25 * ONE_DAY)
        responseThree.responseTime = currentTime - (29 * ONE_DAY)
        responseFour.responseTime = currentTime - ONE_DAY
        responseFive.responseTime = currentTime - (15 * ONE_DAY)
        responseSix.responseTime = currentTime - (27 * ONE_DAY)
        responseSeven.responseTime = currentTime - (22 * ONE_DAY)
        responseEight.responseTime = currentTime - (25 * ONE_DAY)
        responseNine.responseTime = currentTime - (21 * ONE_DAY)

        responseOne = await createLoanResponseSig(web3, nodeOne, responseOne, requestHash)
        responseTwo = await createLoanResponseSig(web3, nodeTwo, responseTwo, requestHash)
        responseThree = await createLoanResponseSig(web3, nodeThree, responseThree, requestHash)
        responseFour = await createLoanResponseSig(web3, nodeFour, responseFour, requestHash)
        responseFive = await createLoanResponseSig(web3, nodeFive, responseFive, requestHash)
        responseSix = await createLoanResponseSig(web3, nodeSix, responseSix, requestHash)
        responseSeven = await createLoanResponseSig(web3, nodeSeven, responseSeven, requestHash)
        responseEight = await createLoanResponseSig(web3, nodeEight, responseEight, requestHash)
        responseNine = await createLoanResponseSig(web3, nodeNine, responseNine, requestHash)
    })

    withData({
        _1_response: [
            320, [responseOne]
        ],
        _2_responses: [
            320, [responseOne, responseTwo]
        ],
        _3_response: [
            100, [responseOne, responseTwo, responseThree]
        ],
        _4_responses: [
            320, [responseOne, responseTwo, responseThree, responseFour]
        ],
        _5_responses: [
            250, [responseOne, responseTwo, responseThree, responseFour, responseFive]
        ],
        _6_responses: [
            320, [responseOne, responseTwo, responseThree, responseFour, responseFive, responseSix]
        ],
        _7_responses: [
            320, [responseOne, responseTwo, responseThree, responseFour, responseFive, responseSix, responseSeven]
        ],
        _8_responses: [
            250, [responseOne, responseTwo, responseThree, responseFour, responseFive, responseSix, responseSeven, responseEight]
        ],
        _9_responses: [
            420, [responseOne, responseTwo, responseThree, responseFour, responseFive, responseSix, responseSeven, responseEight, responseNine]
        ],
    }, function(
        tolerance,
        responses,
    ) {    
        it(t('user', 'new', 'Should accept/not accept a nodes response', false), async function() {
            // Setup
            const expectedMaxGas = expectedGasCost(responses.length);
            settings = await Settings.new(responses.length, tolerance, THIRTY_DAYS, 1, THIRTY_DAYS, 9500);
            instance = await LoanTermsConsensus.new()
            await instance.initialize(loansContract, settings.address)

            for (const response of responses) {
                await instance.addSigner(response.signer)
            }

            const result = await instance.processRequest.estimateGas(
                loanRequest,
                responses, {
                    from: loansContract
                }
            );

            assert(parseInt(result) <= expectedMaxGas);
        })
    })
})