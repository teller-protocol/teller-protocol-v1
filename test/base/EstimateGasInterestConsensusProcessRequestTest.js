const withData = require('leche').withData;
const { createTestSettingsInstance } = require('../utils/settings-helper');
const settingsNames = require('../utils/platformSettingsNames');
const { 
    t,
    getLatestTimestamp,
    ONE_DAY,
    THIRTY_DAYS,
    NULL_ADDRESS,
} = require('../utils/consts');
const { createInterestRequest, createUnsignedInterestResponse } = require('../utils/structs');
const { createInterestResponseSig, hashInterestRequest } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util');
const chains = require('../utils/chains');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const InterestConsensus = artifacts.require("./mock/base/InterestConsensusMock.sol");

contract('EstimateGasInterestConsensusProcessRequestTest', function (accounts) {
    const owner = accounts[0];
    let lenders;
    let instance
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

    const baseGasCost = 266000;
    const expectedGasCost = (responses) => baseGasCost + ((responses -  1) * 82300);

    let responseOne = createUnsignedInterestResponse(nodeOne, 0, 34676, 1, NULL_ADDRESS)
    let responseTwo = createUnsignedInterestResponse(nodeTwo, 0, 34642, 1, NULL_ADDRESS)
    let responseThree = createUnsignedInterestResponse(nodeThree, 0, 34632, 1, NULL_ADDRESS)
    let responseFour = createUnsignedInterestResponse(nodeFour, 0, 34620, 1, NULL_ADDRESS)
    let responseFive = createUnsignedInterestResponse(nodeFive, 0, 34636, 1, NULL_ADDRESS)
    let responseSix = createUnsignedInterestResponse(nodeSix, 0, 34636, 1, NULL_ADDRESS)
    let responseSeven = createUnsignedInterestResponse(nodeSeven, 0, 34636, 1, NULL_ADDRESS)
    let responseEight = createUnsignedInterestResponse(nodeEight, 0, 34636, 1, NULL_ADDRESS)
    let responseNine = createUnsignedInterestResponse(nodeNine, 0, 34636, 1, NULL_ADDRESS)

    before('Setup the response times and signatures', async () => {
        currentTime = await getLatestTimestamp()

        const consensusAddress = accounts[8];
        const chainId = chains.mainnet;
        lenders = await Mock.new();

        interestRequest = createInterestRequest(lender, 1, 23456, endTime, 45678, consensusAddress)
        const requestHash = ethUtil.bufferToHex(hashInterestRequest(interestRequest, lenders.address, chainId))

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

        responseOne = await createInterestResponseSig(web3, nodeOne, responseOne, requestHash, chainId)
        responseTwo = await createInterestResponseSig(web3, nodeTwo, responseTwo, requestHash, chainId)
        responseThree = await createInterestResponseSig(web3, nodeThree, responseThree, requestHash, chainId)
        responseFour = await createInterestResponseSig(web3, nodeFour, responseFour, requestHash, chainId)
        responseFive = await createInterestResponseSig(web3, nodeFive, responseFive, requestHash, chainId)
        responseSix = await createInterestResponseSig(web3, nodeSix, responseSix, requestHash, chainId)
        responseSeven = await createInterestResponseSig(web3, nodeSeven, responseSeven, requestHash, chainId)
        responseEight = await createInterestResponseSig(web3, nodeEight, responseEight, requestHash, chainId)
        responseNine = await createInterestResponseSig(web3, nodeNine, responseNine, requestHash, chainId)
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
            const settings = await createTestSettingsInstance(
                Settings,
                { from: owner, Mock },
                {
                    [settingsNames.RequiredSubmissions]: responses.length,
                    [settingsNames.MaximumTolerance]: tolerance,
                    [settingsNames.ResponseExpiryLength]: THIRTY_DAYS,
                    [settingsNames.TermsExpiryTime]: THIRTY_DAYS,
                    [settingsNames.LiquidateEthPrice]: 9500,
                }
            );
            // The sender validation (equal to the lenders contract) is mocked (InterestConsensusMock _isCaller(...) function) to allow execute the unit test.
            const sender = accounts[1];
            instance = await InterestConsensus.new();
            await instance.initialize(owner, lenders.address, settings.address);

            for (const response of responses) {
                await instance.addSigner(response.signer)
            }

            const result = await instance.processRequest.estimateGas(
                interestRequest,
                responses, {
                    from: sender
                }
            );
            assert(parseInt(result) <= expectedMaxGas, 'Expected max gas less than result.');
        })
    })
})