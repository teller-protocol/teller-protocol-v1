const withData = require('leche').withData;
const { 
    t,
    getLatestTimestamp,
    ONE_DAY,
    THIRTY_DAYS,
    NULL_ADDRESS,
} = require('../utils/consts');
const settingsNames = require('../utils/platformSettingsNames');
const { createLoanRequest, createUnsignedLoanResponse } = require('../utils/structs');
const { createLoanResponseSig, hashLoanTermsRequest } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util')

const BigNumber = require('bignumber.js');
const chains = require('../utils/chains');
const { createTestSettingsInstance } = require('../utils/settings-helper');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LoanTermsConsensus = artifacts.require("./mock/base/LoanTermsConsensusMock.sol");
const Settings = artifacts.require("./base/Settings.sol");


contract('EstimateGasLoanTermsConsensusProcessRequestTest', function (accounts) {
    const owner = accounts[0];
    let instance

    const baseGasCost = 510000;
    const expectedGasCost = (responses) => baseGasCost + ((responses -  1) * 102000);

    let loans
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
    let loanRequest;

    let responseOne = createUnsignedLoanResponse(nodeOne, 0, 1400, 6765, BigNumber("91500000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseTwo = createUnsignedLoanResponse(nodeTwo, 0, 1399, 6766, BigNumber("91500000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseThree = createUnsignedLoanResponse(nodeThree, 0, 1397, 6764, BigNumber("91500000000000000000000").toFixed(), 4, NULL_ADDRESS)
    let responseFour = createUnsignedLoanResponse(nodeFour, 0, 1398, 6764, BigNumber("91500000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseFive = createUnsignedLoanResponse(nodeFive, 0, 1400, 6766, BigNumber("91500000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseSix = createUnsignedLoanResponse(nodeSix, 0, 1400, 6767, BigNumber("91500000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseSeven = createUnsignedLoanResponse(nodeSeven, 0, 1400, 6767, BigNumber("91500000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseEight = createUnsignedLoanResponse(nodeEight, 0, 1400, 6767, BigNumber("91500000000000000000000").toFixed(), 0, NULL_ADDRESS)
    let responseNine = createUnsignedLoanResponse(nodeNine, 0, 1400, 6767, BigNumber("91500000000000000000000").toFixed(), 0, NULL_ADDRESS)

    before('Setup the response times and signatures', async () => {
        currentTime = await getLatestTimestamp()

        const consensusAddress = accounts[8];
        const chainId = chains.mainnet;
        loans = await Mock.new();

        loanRequest = createLoanRequest(borrower, NULL_ADDRESS, requestNonce, 15029398, THIRTY_DAYS, 45612478, consensusAddress)
        const requestHash = ethUtil.bufferToHex(hashLoanTermsRequest(loanRequest, loans.address, chainId))

        responseOne.responseTime = currentTime - (2 * ONE_DAY)
        responseTwo.responseTime = currentTime - (25 * ONE_DAY)
        responseThree.responseTime = currentTime - (29 * ONE_DAY)
        responseFour.responseTime = currentTime - ONE_DAY
        responseFive.responseTime = currentTime - (15 * ONE_DAY)
        responseSix.responseTime = currentTime - (27 * ONE_DAY)
        responseSeven.responseTime = currentTime - (22 * ONE_DAY)
        responseEight.responseTime = currentTime - (25 * ONE_DAY)
        responseNine.responseTime = currentTime - (21 * ONE_DAY)

        responseOne.consensusAddress = consensusAddress;
        responseTwo.consensusAddress = consensusAddress;
        responseThree.consensusAddress = consensusAddress;
        responseFour.consensusAddress = consensusAddress;
        responseFive.consensusAddress = consensusAddress;
        responseSix.consensusAddress = consensusAddress;
        responseSeven.consensusAddress = consensusAddress;
        responseEight.consensusAddress = consensusAddress;
        responseNine.consensusAddress = consensusAddress;

        responseOne = await createLoanResponseSig(web3, nodeOne, responseOne, requestHash, chainId)
        responseTwo = await createLoanResponseSig(web3, nodeTwo, responseTwo, requestHash, chainId)
        responseThree = await createLoanResponseSig(web3, nodeThree, responseThree, requestHash, chainId)
        responseFour = await createLoanResponseSig(web3, nodeFour, responseFour, requestHash, chainId)
        responseFive = await createLoanResponseSig(web3, nodeFive, responseFive, requestHash, chainId)
        responseSix = await createLoanResponseSig(web3, nodeSix, responseSix, requestHash, chainId)
        responseSeven = await createLoanResponseSig(web3, nodeSeven, responseSeven, requestHash, chainId)
        responseEight = await createLoanResponseSig(web3, nodeEight, responseEight, requestHash, chainId)
        responseNine = await createLoanResponseSig(web3, nodeNine, responseNine, requestHash, chainId)
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
            // The sender validation (equal to the loans contract) is mocked (LoanTermsConsensusMock _isCaller(...) function) to allow execute the unit test.
            const sender = accounts[1];
            instance = await LoanTermsConsensus.new();
            await instance.initialize(owner, loans.address, settings.address);

            for (const response of responses) {
                await instance.addSigner(response.signer)
            }

            const result = await instance.processRequest.estimateGas(
                loanRequest,
                responses, {
                    from: sender
                }
            );
            assert(parseInt(result) <= expectedMaxGas, 'Expected max gas less than result.');
        })
    })
})