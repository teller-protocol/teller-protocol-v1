// JS Libraries
const withData = require('leche').withData;
const { t, NULL_BYTES, NULL_ADDRESS } = require('../utils/consts');
const { lenders } = require('../utils/events');
const { createInterestRequest, createUnsignedInterestResponse } = require('../utils/structs');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersMock.sol");
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");

contract('LendersSetAccruedInterestTest', function (accounts) {
    let instance;
    let zTokenInstance;
    let lendingPoolInstance;
    let interestConsensusInstance;
    let interestConsensusTemplate;
    let processRequestEncoding;

    const lenderAddress = accounts[2]

    let emptyRequest;
    let responseOne;
    let responseTwo;
    
    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        lendingPoolInstance = await Mock.new();
        interestConsensusInstance = await Mock.new();
        settingsInstance = await Mock.new();
        instance = await Lenders.new();

        emptyRequest = createInterestRequest(NULL_ADDRESS, 0, 0, 0, interestConsensusInstance.address);
        responseOne = createUnsignedInterestResponse(accounts[0], 0, 35976, 1, interestConsensusInstance.address);
        responseTwo = createUnsignedInterestResponse(accounts[1], 0, 34732, 4, interestConsensusInstance.address);

        await instance.initialize(
            zTokenInstance.address,
            lendingPoolInstance.address,
            interestConsensusInstance.address,
            settingsInstance.address,
        );

        interestConsensusTemplate = await InterestConsensus.new()
        processRequestEncoding = interestConsensusTemplate
            .contract
            .methods
            .processRequest(emptyRequest, [responseOne])
            .encodeABI()
    });

    withData({
        // startTime is after mockTimeLastAccrued
        _1_gap_in_accrual: [1234, 1500, 1500, 1200, 0, 0, true, 'GAP_IN_INTEREST_ACCRUAL',],
        // endTime is not after startTime
        _2_invalid_interval: [1234, 1234, 1500, 1234, 0, 0, true, 'INVALID_INTERVAL',],
        // requestTime was before the endTime
        _3_invalid_request: [1234, 1500, 1400, 1234, 0, 0, true, 'INVALID_REQUEST',],
        _4_valid_request: [1234, 1400, 1500, 1234, 4134, 356, false, undefined],
    }, function(
        startTime,
        endTime,
        requestTime,
        mockTimeLastAccrued,
        mockTotalNotWithdrawn,
        mockTotalAccrued,
        mustFail,
        expectedErrorMessage,
    ) {    
        it(t('user', 'setAccruedInterest', 'Should able to set accrued interest.', false), async function() {
            const interestRequest = {
                lender: lenderAddress,
                consensusAddress: interestConsensusInstance.address,
                startTime: startTime,
                endTime: endTime,
                requestTime: requestTime,
            }

            // Setup
            await instance.mockLenderInfo(
                lenderAddress,
                mockTimeLastAccrued,
                mockTotalNotWithdrawn,
                mockTotalAccrued
            );

            try {

                // mock interest consensus response
                const average = Math.floor((responseOne.interest + responseTwo.interest) / 2)
                await interestConsensusInstance.givenMethodReturnUint(
                    processRequestEncoding,
                    average
                );

                // Invocation
                const result = await instance.setAccruedInterest(
                    interestRequest,
                    [responseOne, responseTwo]
                );

                assert(!mustFail, 'It should have failed because data is invalid.');

                const accruedInterest = await instance.accruedInterest.call(lenderAddress)

                assert(accruedInterest['totalAccruedInterest'], mockTotalAccrued + average)
                assert(accruedInterest['totalNotWithdrawn'], mockTotalNotWithdrawn + average)
                assert(accruedInterest['timeLastAccrued'], endTime)

                lenders
                    .accruedInterestUpdated(result)
                    .emitted(lenderAddress, mockTotalNotWithdrawn + average, mockTotalAccrued + average)
            } catch (error) {
                assert(mustFail, 'Should not have failed');
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});