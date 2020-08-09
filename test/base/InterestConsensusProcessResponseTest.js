const withData = require('leche').withData;
const {
    t,
    getLatestTimestamp,
    THIRTY_DAYS,
    ONE_DAY,
} = require('../utils/consts');
const settingsNames = require('../utils/platformSettingsNames');
const { createInterestRequest, createUnsignedInterestResponse } = require('../utils/structs');
const { createInterestResponseSig, hashInterestRequest } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util')
const { interestConsensus } = require('../utils/events');
const chains = require('../utils/chains');
const { createTestSettingsInstance } = require('../utils/settings-helper');

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const InterestConsensusMock = artifacts.require("./mock/base/InterestConsensusMock.sol");


contract('InterestConsensusProcessResponseTest', function (accounts) {
    let instance
    const lendersContract = accounts[1]
    const nodeAddress = accounts[2]
    const submissions = 5
    const tolerance = 0
    const endTime = 34567
    const lender = accounts[3]

    withData({
        _1_signer_already_submitted: [   // signer already submitted for this loan
            chains.mainnet, 1, 3600, 3, true, false, false, true, 1, 3600, 3600, 3600, true, 'SIGNER_ALREADY_SUBMITTED'
        ],
        _2_signer_nonce_taken: [         // signer nonce is taken already
            chains.mainnet, 2, 3600, 3, true, false, true, false, 1, 3600, 3600, 3600, true, 'SIGNER_NONCE_TAKEN'
        ],
        _3_response_expired: [           // mock an expired response time
            chains.mainnet, 5, 3600, 3, true, true, false, false, 1, 3600, 3600, 3600, true, 'RESPONSE_EXPIRED'
        ],
        _4_signature_invalid: [           // mock the node not being authorized
            chains.mainnet, 6, 3600, 3, false, false, false, false, 1, 3600, 3600, 3600, true, 'SIGNATURE_INVALID'
        ],
        _5_first_valid_submission: [      // mock the first valid submission
            chains.mainnet, 10, 3600, 3, true, false, false, false, 0, 0, 0, 0, false, undefined
        ],
        _6_later_valid_submission: [      // mock a later submission
            chains.mainnet, 15, 4016, 3, true, false, false, false, 6, 4015, 3123, 21282, false, undefined
        ],
        _7_first_valid_submission_ropsten: [      // mock the first valid submission
            chains.ropsten, 20, 4610, 6, true, false, false, false, 0, 0, 0, 0, false, undefined
        ],
    }, function(
        chainId,
        requestNonce,
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
            const settings = await createTestSettingsInstance(
                Settings,
                {
                    [settingsNames.RequiredSubmissions]: submissions,
                    [settingsNames.MaximumTolerance]: tolerance,
                    [settingsNames.ResponseExpiryLength]: THIRTY_DAYS,
                    [settingsNames.TermsExpiryTime]: THIRTY_DAYS,
                    [settingsNames.LiquidateEthPrice]: 9500,
                }
            );
            instance = await InterestConsensusMock.new()
            await instance.initialize(lendersContract, settings.address)

            const interestRequest = createInterestRequest(lender, requestNonce, 23456, endTime, 45678, instance.address)
            const requestHash = ethUtil.bufferToHex(hashInterestRequest(interestRequest, lendersContract, chainId))

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
            await instance.mockChainId(chainId)

            let interestResponse = createUnsignedInterestResponse(nodeAddress, responseTime, interest, signerNonce, instance.address)
            interestResponse = await createInterestResponseSig(web3, nodeAddress, interestResponse, requestHash, chainId)

            try {
                const result = await instance.externalProcessResponse(
                    interestRequest,
                    interestResponse,
                    requestHash
                );

                assert(!mustFail, 'It should have failed because data is invalid.');

                interestConsensus
                    .interestSubmitted(result)
                    .emitted(nodeAddress, lender, interestRequest.requestNonce, endTime, interest);

                let submission = await instance.interestSubmissions.call(lender, endTime)

                if (mockTotalSubmissions == 0) {
                    assert(submission['count'].toNumber(), 1, 'Total submissions incorrect')
                    assert(submission['min'].toNumber(), interest, 'Min incorrect')
                    assert(submission['max'].toNumber(), interest, 'Max incorrect')
                    assert(submission['sum'].toNumber(), interest, 'Sum incorrect')
                } else {
                    const newMin = interest < mockMinValue ? interest : mockMinValue
                    const newMax = interest < mockMaxValue ? interest : mockMaxValue
                    const newSum = mockSumOfValues + interest
                    const newTotal = mockTotalSubmissions + 1

                    assert(submission['count'].toNumber(), newTotal, 'Total submissions incorrect')
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