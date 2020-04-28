// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { hashRequest } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util')

// Smart contracts
const InterestConsensusMock = artifacts.require("./mock/base/InterestConsensusMock.sol");

// constants
const { NULL_ADDRESS } = require('../utils/consts');

contract('InterestConsensusHashRequestTest', function (accounts) {
    const tolerance = 0
    const submissions = 1
    let instance

    beforeEach('Setup for each test', async () => {
        instance = await InterestConsensusMock.new(submissions, tolerance)
    })

    withData({
        _1_first_test: [accounts[1], accounts[2], 234764, 344673177, 34467317723],
        _2_second_test: [accounts[4], NULL_ADDRESS, 0, 0, 0],
    }, function(
        msgSender,
        lender,
        startTime,
        endTime,
        requestTime,
    ) {    
        it(t('user', 'new', 'Should correctly calculate the hash', false), async function() {
            let expectedResult = ethUtil.bufferToHex(
                hashRequest(
                    {
                        lender: lender,
                        startTime: startTime,
                        endTime: endTime,
                        requestTime: requestTime,
                    },
                    msgSender
                )
            )

            // Invocation
            const result = await instance.externalHashRequest.call(
                {
                  lender: lender,
                  startTime: startTime,
                  endTime: endTime,
                  requestTime: requestTime,
                },
                {
                    from: msgSender
                }
            );

            assert.equal(result, expectedResult, 'Result should have been ' + expectedResult);
        });
    });
});