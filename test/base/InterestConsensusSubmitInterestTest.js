// const withData = require('leche').withData;
// const { t } = require('../utils/consts');
// const { hashInterest, signHash } = require('../utils/hashes');
// const ethUtil = require('ethereumjs-util')
// const { interestConsensus } = require('../utils/events');

// const LendersInterfaceEncoder = require('../utils/encoders/LendersInterfaceEncoder');

// // Smart contracts
// const InterestConsensusMock = artifacts.require("./mock/base/InterestConsensusMock.sol");
// const Mock = artifacts.require("./mock/util/Mock.sol");

// // constants
// const { NULL_ADDRESS } = require('../utils/consts');

// contract('InterestConsensusSubmitInterestTest', function (accounts) {
//     let instance
//     let lendersInstance

//     const msgSender = accounts[0]
//     const lender = accounts[1]

//     const lendersInterfaceEncoder = new LendersInterfaceEncoder(web3);

//     withData({
//         _1_signer_already_submitted: [      // signer already submitted for this loan
//             5, 0, 4, 3600, 3, msgSender, false, true, 4, 1, 3600, 3600, 3600, false, true, 'SIGNER_ALREADY_SUBMITTED'
//         ],
//         _2_signer_nonce_taken: [            // signer nonce 3 is already taken
//             5, 0, 4, 3600, 3, msgSender, true, false, 4, 1, 3600, 3600, 3600, false, true, 'SIGNER_NONCE_TAKEN'
//         ],
//         _3_interest_not_requested: [        // requested block different to submitted block
//             5, 0, 4, 3600, 3, msgSender, false, false, 3, 1, 3600, 3600, 3600, false, true, 'INTEREST_NOT_REQUESTED'
//         ],
//         _4_interest_already_finalized: [    // finalized is true
//             5, 0, 4, 3600, 3, msgSender, false, false, 4, 1, 3600, 3600, 3600, true, true, 'INTEREST_ALREADY_FINALIZED'
//         ],
//         _5_signature_not_valid: [           // signed by the lender
//             5, 0, 4, 3600, 3, lender, false, false, 4, 1, 3600, 3600, 3600, false, true, 'SIGNATURE_NOT_VALID'
//         ],
//         _6_first_submission_for_loan: [     // no info in node submissions mocking
//             5, 0, 4, 3600, 3, msgSender, false, false, 4, 0, 0, 0, 0, false, false, undefined
//         ],
//         _7_new_min_value: [                 // submission is less than current min
//             5, 0, 4, 3123, 3, msgSender, false, false, 4, 2, 3333, 3214, 6547, false, false, undefined
//         ],
//         _8_new_max_value: [                 // submission is more than current max
//             5, 0, 4, 3400, 3, msgSender, false, false, 4, 2, 3333, 3214, 6547, false, false, undefined
//         ],
//         _9_final_interest_outside_tolerance: [  // after submission, average=14250, average-tolerance=14075, min=14074
//             5, 123, 4, 14074, 3, msgSender, false, false, 4, 4, 14350, 14200, 57176, false, true, 'MAXIMUM_TOLERANCE_SURPASSED'
//         ],
//         _10_final_interest_inside_tolerance: [  // after submission, average=34860
//             5, 320, 4, 35970, 3, msgSender, false, false, 4, 4, 35000, 33780, 138330, false, false, undefined
//         ],
//     }, function(
//         submissions,
//         tolerance,
//         blockNumber,
//         interest,
//         signerNonce,
//         signer,
//         mockSignerNonceTaken,
//         mockHasSubmitted,
//         mockBlockRequested,
//         mockTotalSubmissions,
//         mockMaxValue,
//         mockMinValue,
//         mockSumOfValues,
//         mockFinalized,
//         mustFail,
//         expectedErrorMessage,
//     ) {    
//         it(t('user', 'new', 'Should correctly update the node submissions', false), async function() {
//             // set up contract
//             instance = await InterestConsensusMock.new(submissions, tolerance)
//             lendersInstance = await Mock.new()
//             await instance.initialize(lendersInstance.address)

//             // mock data for the test
//             await instance.mockHasSubmitted(msgSender, lender, blockNumber, mockHasSubmitted)
//             await instance.mockSignerNonce(msgSender, signerNonce, mockSignerNonceTaken)
//             await instance.mockNodeSubmissions(
//                 lender,
//                 mockBlockRequested,
//                 mockTotalSubmissions,
//                 mockMaxValue,
//                 mockMinValue,
//                 mockSumOfValues,
//                 mockFinalized
//             )

//             // mock lenders response
//             await lendersInstance.givenMethodReturnUint(
//                 lendersInterfaceEncoder.encodeRequestInterestUpdate(),
//                 mockBlockRequested
//             );

//             // hash and sign the interest information
//             let hashedData = hashInterest(
//                 instance.address,
//                 {
//                     lender: lender,
//                     blockNumber: blockNumber,
//                     interest: interest,
//                     signerNonce: signerNonce,
//                 }
//             )
//             let signature = await signHash(web3, signer, hashedData);

//             try {
//                 const result = await instance.submitInterestResult(
//                     {
//                         signerNonce: signerNonce,
//                         v: signature.v,
//                         r: signature.r,
//                         s: signature.s
//                     },
//                     lender,
//                     blockNumber,
//                     interest,
//                     {
//                         from: msgSender
//                     }
//                 );

//                 assert(!mustFail, 'It should have failed because data is invalid.');
//                 // event emitted
//                 interestConsensus
//                   .interestSubmitted(result)
//                   .emitted(signer, lender, blockNumber, interest);

//                 let nodeSubmissions = await instance.nodeSubmissions.call(lender, mockBlockRequested)

//                 if (mockTotalSubmissions == 0) {
//                     assert(nodeSubmissions['totalSubmissions'].toNumber(), 1, 'Total submissions incorrect')
//                     assert(nodeSubmissions['minValue'].toNumber(), interest, 'Min incorrect')
//                     assert(nodeSubmissions['maxValue'].toNumber(), interest, 'Max incorrect')
//                     assert(nodeSubmissions['sumOfValues'].toNumber(), interest, 'Sum incorrect')
//                     assert(nodeSubmissions['finalized'].toString(), false, 'Finalized incorrect')
//                 } else {
//                     const newMin = interest < mockMinValue ? interest : mockMinValue
//                     const newMax = interest < mockMaxValue ? interest : mockMaxValue
//                     const newSum = mockSumOfValues + interest
//                     const newTotal = mockTotalSubmissions + 1
//                     const finalized = (newTotal >= submissions)

//                     assert(nodeSubmissions['totalSubmissions'].toNumber(), newTotal, 'Total submissions incorrect')
//                     assert(nodeSubmissions['minValue'].toNumber(), newMin, 'Min incorrect')
//                     assert(nodeSubmissions['maxValue'].toNumber(), newMax, 'Max incorrect')
//                     assert(nodeSubmissions['sumOfValues'].toNumber(), newSum, 'Sum incorrect')
//                     assert(nodeSubmissions['finalized'].toString(), finalized, 'Finalized incorrect')

//                     if (newTotal >= submissions) {
//                         const finalInterest = Math.floor(newSum / newTotal)

//                         interestConsensus
//                           .interestAccepted(result)
//                           .emitted(lender, blockNumber, finalInterest);
//                     }
//                 }

//             } catch (error) {
//                 // Assertions
//                 assert(mustFail, 'Should not have failed');
//                 assert.equal(error.reason, expectedErrorMessage);
//             }
//         })
//     })
// })