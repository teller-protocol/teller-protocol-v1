// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const { atmGovernance } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMGovernance = artifacts.require("./ATM/ATMGovernance.sol");

contract('ATMGovernanceRemoveDataProviderTest', function (accounts) {
    let instance;

    beforeEach('Setup for each test', async () => {
        instance = await ATMGovernance.new();
    });

    // Testing values
    const DATA_TYPE_INDEX = 0;
    const INVALID_DATA_TYPE_INDEX = 2;
    const FIRST_DATA_PROVIDER_INDEX = 0;
    const INVALID_DATA_PROVIDER_INDEX = 2;

    withData({
        _1_basic: [0, DATA_TYPE_INDEX, FIRST_DATA_PROVIDER_INDEX, undefined, false],
        _2_notSigner: [2, DATA_TYPE_INDEX, FIRST_DATA_PROVIDER_INDEX, 'SignerRole: caller does not have the Signer role', true],
        _3_dataProviderNotFound: [0, DATA_TYPE_INDEX, INVALID_DATA_PROVIDER_INDEX, "DATA_PROVIDER_OUT_RANGE", true],
        _4_dataTypeNotFound: [0, INVALID_DATA_TYPE_INDEX, INVALID_DATA_PROVIDER_INDEX, "DATA_PROVIDER_OUT_RANGE", true],
        _5_dataTypeNotFound: [0, INVALID_DATA_TYPE_INDEX, FIRST_DATA_PROVIDER_INDEX, "DATA_PROVIDER_OUT_RANGE", true],
     }, function (senderIndex, dataTypeIndex, dataProviderIndex, expectedErrorMessage, mustFail) {
        it(t('user', 'removeDataProvider#1', 'Should (or not) be able to remove a data provider.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            const validSender = accounts[0];
            const dataProviderContract = await Mock.new();
            const dataProviderAddress = dataProviderContract.address;
            // Preconditions
            await instance.addDataProvider(DATA_TYPE_INDEX, dataProviderAddress, { from: validSender });
            try {
                // Invocation
                const result = await instance.removeDataProvider(dataTypeIndex, dataProviderIndex, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating events were emitted
                atmGovernance
                    .dataProviderRemoved(result)
                    .emitted(sender, dataTypeIndex, dataProviderIndex, dataProviderAddress );

                // Validating state variables were modified
                //await instance.getDataProvider(dataTypeIndex, dataProviderIndex);

            } catch (error) {
                console.log(error.reason);
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });


    withData({
        _1_basic: [0, DATA_TYPE_INDEX, FIRST_DATA_PROVIDER_INDEX, undefined, false],
     }, function (senderIndex, dataTypeIndex, dataProviderIndex, expectedErrorMessage, mustFail) {
        it(t('user', 'removeDataProvider#2', 'Should (or not) be able to remove a data provider.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            const validSender = accounts[0];
            const dataProviderContract = await Mock.new();
            const dataProviderAddress = dataProviderContract.address;
            // Preconditions
            await instance.addDataProvider(DATA_TYPE_INDEX, dataProviderAddress, { from: validSender });
            try {
                // Invocation
                const result = await instance.removeDataProvider(dataTypeIndex, dataProviderIndex, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating events were emitted
                atmGovernance
                    .dataProviderRemoved(result)
                    .emitted(sender, dataTypeIndex, dataProviderIndex, dataProviderAddress );

                // Validating state variables were modified
                //await instance.getDataProvider(dataTypeIndex, dataProviderIndex);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});