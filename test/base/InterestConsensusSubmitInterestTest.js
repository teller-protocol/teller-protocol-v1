const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { hashInterest, signHash } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util')
const { interestConsensus } = require('../utils/events');

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
        _1_signer_already_submitted: [      // signer already submitted for this loan
            5, 0, 5, 3600, 3, msgSender, false, true, 5, 1, 3600, 3600, 3600, false, true, 'SIGNER_ALREADY_SUBMITTED'
        ],
        _2_signer_nonce_taken: [            // signer nonce 3 is already taken
            5, 0, 5, 3600, 3, msgSender, true, false, 5, 1, 3600, 3600, 3600, false, true, 'SIGNER_NONCE_TAKEN'
        ],
        _3_interest_not_requested: [        // requested block different to submitted block
            5, 0, 5, 3600, 3, msgSender, false, false, 3, 1, 3600, 3600, 3600, false, true, 'INTEREST_NOT_REQUESTED'
        ],
        _4_interest_already_finalized: [    // finalized is true
            5, 0, 5, 3600, 3, msgSender, false, false, 5, 1, 3600, 3600, 3600, true, true, 'INTEREST_ALREADY_FINALIZED'
        ],
        _5_signature_not_valid: [           // signed by the lender
            5, 0, 5, 3600, 3, lender, false, false, 5, 1, 3600, 3600, 3600, false, true, 'SIGNATURE_NOT_VALID'
        ],
        _6_first_submission_for_loan: [           // no info in node submissions mocking
            5, 0, 5, 3600, 3, msgSender, false, false, 5, 0, 0, 0, 0, false, false, undefined
        ],
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
            let signature = await signHash(web3, signer, hashedData);

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
                    {
                        from: msgSender
                    }
                );

                assert(!mustFail, 'It should have failed because data is invalid.');
                // event emitted
                interestConsensus
                  .interestSubmitted(result)
                  .emitted(signer, lender, blockNumber, interest);

                let nodeSubmissions = await instance.nodeSubmissions.call(lender, mockBlockRequested)

                if (mockTotalSubmissions == 0) {
                    assert(nodeSubmissions['totalSubmissions'].toNumber(), 1, 'Total submissions incorrect')
                    assert(nodeSubmissions['minValue'].toNumber(), interest, 'Min incorrect')
                    assert(nodeSubmissions['maxValue'].toNumber(), interest, 'Max incorrect')
                    assert(nodeSubmissions['sumOfValues'].toNumber(), interest, 'Sum incorrect')
                    assert(nodeSubmissions['finalized'].toString(), false, 'Finalized incorrect')
                } else {
                }

            } catch (error) {
                // Assertions
                assert(mustFail, 'Should not have failed');
                assert.equal(error.reason, expectedErrorMessage);
            }
        })
    })
})