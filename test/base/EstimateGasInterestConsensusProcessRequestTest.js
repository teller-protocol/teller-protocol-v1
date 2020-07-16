const withData = require('leche').withData;
const { 
    t,
    getLatestTimestamp,
    ONE_DAY,
    THIRTY_DAYS
} = require('../utils/consts');
const { createInterestRequest, createUnsignedInterestResponse } = require('../utils/structs');
const { createInterestResponseSig, hashInterestRequest } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util')

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");


contract('EstimateGasInterestConsensusProcessRequestTest', function (accounts) {
    let instance
    const lendersContract = accounts[1]
    const nodeOne = accounts[1]
    const nodeTwo = accounts[2]
    const nodeThree = accounts[3]
    const nodeFour = accounts[4]
    const nodeFive = accounts[5]
    const nodeSix = accounts[6]
    const nodeSeven = accounts[7]
    const nodeEight = accounts[8]
    const nodeNine = accounts[9]
    const lender = accounts[9]
    const endTime = 34567

    let currentTime;
    let interestRequest;

    const baseGasCost = 201094;
    const expectedGasCost = (responses) => baseGasCost + ((responses -  1) * 73000);

    let responseOne = createUnsignedInterestResponse(nodeOne, 0, 34676, 1)
    let responseTwo = createUnsignedInterestResponse(nodeTwo, 0, 34642, 1)
    let responseThree = createUnsignedInterestResponse(nodeThree, 0, 34632, 1)
    let responseFour = createUnsignedInterestResponse(nodeFour, 0, 34620, 1)
    let responseFive = createUnsignedInterestResponse(nodeFive, 0, 34636, 1)
    let responseSix = createUnsignedInterestResponse(nodeSix, 0, 34636, 1)
    let responseSeven = createUnsignedInterestResponse(nodeSeven, 0, 34636, 1)
    let responseEight = createUnsignedInterestResponse(nodeEight, 0, 34636, 1)
    let responseNine = createUnsignedInterestResponse(nodeNine, 0, 34636, 1)

    before('Setup the response times and signatures', async () => {
        currentTime = await getLatestTimestamp()

        const consensusAddress = accounts[8];

        interestRequest = createInterestRequest(lender, 23456, endTime, 45678, consensusAddress)
        const requestHash = ethUtil.bufferToHex(hashInterestRequest(interestRequest, lendersContract))

        responseOne.responseTime = currentTime - (2 * ONE_DAY)
        responseTwo.responseTime = currentTime - (25 * ONE_DAY)
        responseThree.responseTime = currentTime - (29 * ONE_DAY)
        responseFour.responseTime = currentTime - ONE_DAY
        responseFive.responseTime = currentTime - (15 * ONE_DAY)
        responseSix.responseTime = currentTime - (21 * ONE_DAY)
        responseSeven.responseTime = currentTime - (20 * ONE_DAY)
        responseEight.responseTime = currentTime - (24 * ONE_DAY)
        responseNine.responseTime = currentTime - (26 * ONE_DAY)

        responseOne.consensusAddress = consensusAddress;
        responseTwo.consensusAddress = consensusAddress;
        responseThree.consensusAddress = consensusAddress;
        responseFour.consensusAddress = consensusAddress;
        responseFive.consensusAddress = consensusAddress;
        responseSix.consensusAddress = consensusAddress;
        responseSeven.consensusAddress = consensusAddress;
        responseEight.consensusAddress = consensusAddress;
        responseNine.consensusAddress = consensusAddress;

        responseOne = await createInterestResponseSig(web3, nodeOne, responseOne, requestHash)
        responseTwo = await createInterestResponseSig(web3, nodeTwo, responseTwo, requestHash)
        responseThree = await createInterestResponseSig(web3, nodeThree, responseThree, requestHash)
        responseFour = await createInterestResponseSig(web3, nodeFour, responseFour, requestHash)
        responseFive = await createInterestResponseSig(web3, nodeFive, responseFive, requestHash)
        responseSix = await createInterestResponseSig(web3, nodeSix, responseSix, requestHash)
        responseSeven = await createInterestResponseSig(web3, nodeSeven, responseSeven, requestHash)
        responseEight = await createInterestResponseSig(web3, nodeEight, responseEight, requestHash)
        responseNine = await createInterestResponseSig(web3, nodeNine, responseNine, requestHash)
    })

    withData({
        _1_response: [
            320, [responseOne]
        ],
        _2_responses: [ 
            320, [responseOne, responseTwo]
        ],
        _3_responses: [
            120, [responseOne, responseTwo, responseThree]
        ],
        _4_responses: [
            90, [responseOne, responseTwo, responseThree, responseFour]
        ],
        _5_responses: [
            150, [responseOne, responseTwo, responseThree, responseFour, responseFive]
        ],
        _6_responses: [
            190, [responseOne, responseTwo, responseThree, responseFour, responseFive, responseSix]
        ],
        _7_responses: [
            110, [responseOne, responseTwo, responseThree, responseFour, responseFive, responseSix, responseSeven]
        ],
        _8_responses: [
            180, [responseOne, responseTwo, responseThree, responseFour, responseFive, responseSix, responseSeven, responseEight]
        ],
        _9_responses: [
            220, [responseOne, responseTwo, responseThree, responseFour, responseFive, responseSix, responseSeven, responseEight, responseNine]
        ],
    }, function(
        tolerance,
        responses,
    ) {    
        it(t('user', 'new', 'Should accept/not accept a nodes response', false), async function() {
            // set up contract
            const expectedMaxGas = expectedGasCost(responses.length);
            const settings = await Settings.new(responses.length, tolerance, THIRTY_DAYS, 1, THIRTY_DAYS, 9500);
            instance = await InterestConsensus.new();
            await instance.initialize(lendersContract, settings.address);

            for (const response of responses) {
                await instance.addSigner(response.signer)
            }

            const result = await instance.processRequest.estimateGas(
                interestRequest,
                responses, {
                    from: lendersContract
                }
            );
            assert(parseInt(result) <= expectedMaxGas);
        })
    })
})