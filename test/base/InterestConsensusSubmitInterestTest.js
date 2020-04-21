const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { hashInterest, signHash } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util')

const LendersInterfaceEncoder = require('../utils/encoders/LendersInterfaceEncoder');

// Smart contracts
const InterestConsensusMock = artifacts.require("./mock/base/InterestConsensusMock.sol");
const Mock = artifacts.require("./mock/util/Mock.sol");

// constants
const { NULL_ADDRESS } = require('../utils/consts');

contract('InterestConsensusSubmitInterestTest', function (accounts) {
    const tolerance = 0
    const submissions = 1
    let instance
    let lendersInstance

    const msgSender = accounts[0]
    const lender = accounts[1]

    const lendersInterfaceEncoder = new LendersInterfaceEncoder(web3);

    beforeEach('Setup for each test', async () => {
        
    })

    withData({
        _1_signer_already_submitted: [
            5, 0, 5, 3600, 3, msgSender, false, true, 5, 1, 3600, 3600, 3600, false, true, 'SIGNER_ALREADY_SUBMITTED'
        ],
        _2_signer_nonce_taken: [
            5, 0, 5, 3600, 3, msgSender, true, false, 5, 1, 3600, 3600, 3600, false, true, 'SIGNER_NONCE_TAKEN'
        ],
        _3_interest_not_requested: [
            5, 0, 5, 3600, 3, msgSender, false, false, 3, 1, 3600, 3600, 3600, false, true, 'INTEREST_NOT_REQUESTED'
        ],
        // _4_interest_already_finalized: [NULL_ADDRESS, 0, 0, 0],
        // _5_signature_not_valid: [NULL_ADDRESS, 0, 0, 0],
        // _5_signature_not_valid: [NULL_ADDRESS, 0, 0, 0],
    }, function(
        submissions,
        tolerance,
        blockNumber,
        interest,
        signerNonce,
        signer,
        mockSignerNonceTaken,
        mockHasSubmitted,
        mockBlockRequested,
        mockTotalSubmissions,
        mockMaxValue,
        mockMinValue,
        mockSumOfValues,
        mockFinalized,
        mustFail,
        expectedErrorMessage,
    ) {    
        it(t('user', 'new', 'Should correctly calculate the hash', false), async function() {
            // set up contract
            instance = await InterestConsensusMock.new(submissions, tolerance)
            lendersInstance = await Mock.new()
            await instance.initialize(lendersInstance.address)

            // mock data for the test
            await instance.mockHasSubmitted(msgSender, lender, blockNumber, mockHasSubmitted)
            await instance.mockSignerNonce(msgSender, signerNonce, mockSignerNonceTaken)
            await instance.mockNodeSubmissions(
                lender,
                mockBlockRequested,
                mockTotalSubmissions,
                mockMaxValue,
                mockMinValue,
                mockSumOfValues,
                mockFinalized
            )

            // mock lenders response
            await lendersInstance.givenMethodReturnUint(
              lendersInterfaceEncoder.encodeRequestInterestUpdate(),
              mockBlockRequested
          );

            // hash and sign the interest information
            let hashedData = hashInterest(
                instance.address,
                {
                    lender: lender,
                    blockNumber: blockNumber,
                    interest: interest,
                    signerNonce: signerNonce,
                }
            )
            let signature = await await signHash(web3, signer, hashedData);

            try {
                const result = await instance.submitInterestResult(
                    {
                        signerNonce: signerNonce,
                        v: signature.v,
                        r: signature.r,
                        s: signature.s
                    },
                    lender,
                    blockNumber,
                    interest,
                );

                assert(!mustFail, 'It should have failed because data is invalid.');

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert.equal(error.reason, expectedErrorMessage);
            }

        })
    })
})