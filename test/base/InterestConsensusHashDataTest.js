// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { hashInterest } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util')

// Smart contracts
const InterestConsensusMock = artifacts.require("./mock/base/InterestConsensusMock.sol");

// constants
const { NULL_ADDRESS } = require('../utils/consts');

contract('InterestConsensusHashDataTest', function (accounts) {
    const tolerance = 0
    const submissions = 1
    let instance

    beforeEach('Setup for each test', async () => {
        instance = await InterestConsensusMock.new(submissions, tolerance)
    })

    withData({
        _1_first_test: [accounts[1], 234764, 344673177, 246],
        _2_second_test: [NULL_ADDRESS, 0, 0, 0],
    }, function(
        lender,
        blockNumber,
        interest,
        signerNonce,
    ) {    
        it(t('user', 'new', 'Should correctly calculate the hash', false), async function() {
            let expectedResult = ethUtil.bufferToHex(
                hashInterest(
                    instance.address,
                    {
                        lender: lender,
                        blockNumber: blockNumber,
                        interest: interest,
                        signerNonce: signerNonce,
                    }
                )
            )

            // Invocation
            const result = await instance.externalHashData(
                lender,
                blockNumber,
                interest,
                signerNonce,
            );

            assert.equal(result, expectedResult, 'Result should have been ' + expectedResult);
        });
    });
});