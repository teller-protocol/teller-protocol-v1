const withData = require('leche').withData;
const {
    t,
    getLatestTimestamp,
    THIRTY_DAYS,
    NULL_ADDRESS,
    ONE_DAY
} = require('../utils/consts');
const { createLoanRequest, createUnsignedLoanResponse } = require('../utils/structs');
const { createLoanResponseSig, hashLoanTermsRequest } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util')
const { loanTermsConsensus } = require('../utils/events');
const BigNumber = require('bignumber.js');

// Smart contracts
const LoanTermsConsensusMock = artifacts.require("./mock/base/LoanTermsConsensusMock.sol");
const Settings = artifacts.require("./mock/base/Settings.sol");

contract('LoanTermsConsensusProcessResponseTest', function (accounts) {
    let instance
    let settings
    const loansContract = accounts[1]
    const nodeAddress = accounts[2]
    const requiredSubs = 5
    const tolerance = 0
    const borrower = accounts[3]
    const requestNonce = 142

    const loanRequest = createLoanRequest(borrower, NULL_ADDRESS, requestNonce, 15029398, THIRTY_DAYS, 45612478)

    const requestHash = ethUtil.bufferToHex(hashLoanTermsRequest(loanRequest, loansContract))

    let mockInterest = {
        min: 1220,
        max: 1420,
        count: 4,
        sum: 5411,
    }

    let mockCollateral = {
        min: 6512,
        max: 7192,
        count: 4,
        sum: 27256,
    }

    let mockMaxAmount = {
        min: BigNumber("81500000000000000000000"),  //81,500 USDC
        max: BigNumber("100000000000000000000000"), // 100,000 USDC
        count: 4,
        sum: BigNumber("380000000000000000000000"), // 100,000 USDC
    }

    withData({
        _1_signer_already_submitted: [   // signer already submitted for this loan
            1211, 6632, BigNumber("123000000000000000000000"), 3, true, false, false, true, true, true, 'SIGNER_ALREADY_SUBMITTED'
        ],
        _2_signer_nonce_taken: [         // signer nonce is taken already
            1211, 6632, BigNumber("123000000000000000000000"), 3, true, false, true, false, true, true, 'SIGNER_NONCE_TAKEN'
        ],
        _3_response_expired: [           // mock an expired response time
            1211, 6632, BigNumber("123000000000000000000000"), 3, true, true, false, false, true, true, 'RESPONSE_EXPIRED'
        ],
        _4_signature_invalid: [           // mock the node not being authorized
            1211, 6632, BigNumber("123000000000000000000000"), 3, false, false, false, false, true, true, 'SIGNATURE_INVALID'
        ],
        _5_first_valid_submission: [      // mock the first valid submission
            1211, 6632, BigNumber("123000000000000000000000"), 3, true, false, false, false, false, false, undefined
        ],
        _6_later_valid_submission: [      // mock a later submission
            1211, 6632, BigNumber("123000000000000000000000"), 3, true, false, false, false, true, false, undefined
        ],
    }, function(
        interestRate,
        collateralRatio,
        maxLoanAmount,
        signerNonce,
        nodeIsSignerRole,
        responseExpired,
        mockSignerNonceTaken,
        mockHasSubmitted,
        previousSubmissions,
        mustFail,
        expectedErrorMessage,
    ) {    
        it(t('user', 'new', 'Should accept/not accept a nodes response', false), async function() {
            // set up contract
            settings = await Settings.new(requiredSubs, tolerance, THIRTY_DAYS, 1)
            instance = await LoanTermsConsensusMock.new()
            await instance.initialize(loansContract, settings.address)

            const currentTime = await getLatestTimestamp()
            const responseTime = responseExpired ?
                currentTime - THIRTY_DAYS - ONE_DAY :   // thirty one days ago
                currentTime - THIRTY_DAYS + ONE_DAY     // twenty nine days ago

            // mock data for the test
            if (nodeIsSignerRole) {
                await instance.addSigner(nodeAddress)
            }
            await instance.mockHasSubmitted(nodeAddress, borrower, requestNonce, mockHasSubmitted)
            await instance.mockSignerNonce(nodeAddress, signerNonce, mockSignerNonceTaken)

            if (previousSubmissions) {
                await instance.mockInterestRateSubmissions(
                    borrower,
                    requestNonce,
                    mockInterest['count'],
                    mockInterest['max'],
                    mockInterest['min'],
                    mockInterest['sum']
                )
                await instance.mockCollateralRatioSubmissions(
                    borrower,
                    requestNonce,
                    mockCollateral['count'],
                    mockCollateral['max'],
                    mockCollateral['min'],
                    mockCollateral['sum']
                )
                await instance.mockMaxAmountSubmissions(
                    borrower,
                    requestNonce,
                    mockMaxAmount['count'],
                    mockMaxAmount['max'],
                    mockMaxAmount['min'],
                    mockMaxAmount['sum']
                )
            }

            let loanResponse = createUnsignedLoanResponse(nodeAddress, responseTime, interestRate, collateralRatio, maxLoanAmount.toFixed(), signerNonce)
            loanResponse = await createLoanResponseSig(web3, nodeAddress, loanResponse, requestHash)

            try {
                const result = await instance.externalProcessResponse(
                    loanRequest,
                    loanResponse,
                    requestHash
                );

                assert(!mustFail, 'It should have failed because data is invalid.');

                loanTermsConsensus
                    .termsSubmitted(result)
                    .emitted(nodeAddress, borrower, requestNonce, interestRate, collateralRatio, maxLoanAmount.toFixed());

                let submissions = await instance.termSubmissions.call(borrower, requestNonce)

                if (!previousSubmissions) {
                    assert(submissions['interestRate']['count'], 1, 'Total submissions incorrect')
                    assert(submissions['interestRate']['min'], interestRate, 'Min incorrect')
                    assert(submissions['interestRate']['max'], interestRate, 'Max incorrect')
                    assert(submissions['interestRate']['sum'], interestRate, 'Sum incorrect')
                    assert(submissions['collateralRatio']['count'], 1, 'Total submissions incorrect')
                    assert(submissions['collateralRatio']['min'], collateralRatio, 'Min incorrect')
                    assert(submissions['collateralRatio']['max'], collateralRatio, 'Max incorrect')
                    assert(submissions['collateralRatio']['sum'], collateralRatio, 'Sum incorrect')
                    assert(submissions['maxLoanAmount']['count'], 1, 'Total submissions incorrect')
                    assert(submissions['maxLoanAmount']['min'], maxLoanAmount, 'Min incorrect')
                    assert(submissions['maxLoanAmount']['max'], maxLoanAmount, 'Max incorrect')
                    assert(submissions['maxLoanAmount']['sum'], maxLoanAmount, 'Sum incorrect')
                } else {
                    mockInterest['min'] = interestRate
                    mockInterest['count'] += 1
                    mockCollateral['count'] += 1
                    mockMaxAmount['count'] += 1
                    mockMaxAmount['max'] = maxLoanAmount
                  
                    assert(submissions['interestRate'], mockInterest, 'interest rate incorrect')
                    assert(submissions['collateralRatio'], mockCollateral, 'interest rate incorrect')
                    assert(submissions['maxLoanAmount'], mockMaxAmount, 'interest rate incorrect')
                }
            } catch (error) {
                assert(mustFail, 'Should not have failed');
                assert.equal(error.reason, expectedErrorMessage);
            }
        })
    })
})