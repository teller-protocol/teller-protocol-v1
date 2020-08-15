// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { atmGovernance } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");

contract('ATMGovernanceUpdateDataProviderTest', function (accounts) {
    const owner = accounts[0];
    let instance;

    beforeEach('Setup for each test', async () => {
        instance = await ATMGovernance.new();
        await instance.initialize(owner);
    });

    // Testing values
    const DATA_TYPE_INDEX = 0;
    const DATA_PROVIDER_INDEX = 0;
    const INVALID_DATA_PROVIDER_INDEX = 2;

    withData({
        _1_basic: [0, DATA_TYPE_INDEX, DATA_PROVIDER_INDEX, false, undefined, false],
        _2_notSigner: [2, DATA_TYPE_INDEX, DATA_PROVIDER_INDEX, false, 'SignerRole: caller does not have the Signer role', true],
        _3_dataProviderNotFound: [0, DATA_TYPE_INDEX, INVALID_DATA_PROVIDER_INDEX, false, "DATA_PROVIDER_OUT_RANGE", true],
        _4_sameOldProvider: [0, DATA_TYPE_INDEX, DATA_PROVIDER_INDEX, true, 'DATA_PROVIDER_SAME_OLD', true],
     }, function (senderIndex, dataTypeIndex, dataProviderIndex, repeatProvider, expectedErrorMessage, mustFail) {
        it(t('user', 'updateDataProvider#1', 'Should (or not) be able to update a data provider.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            const validSender = accounts[0];
            const dataProviderContract = await Mock.new();
            const oldDataProvider = dataProviderContract.address;
            const newDataProviderContract = await Mock.new();
            let newDataProvider = newDataProviderContract.address;
            // Precondition
            await instance.addDataProvider(DATA_TYPE_INDEX, oldDataProvider, { from: validSender });
            if (repeatProvider) {
                newDataProvider = oldDataProvider;
            }
            try {

                // Invocation
                const result = await instance.updateDataProvider(dataTypeIndex, dataProviderIndex, newDataProvider, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were modified
                const aDataProvider = await instance.getDataProvider(dataTypeIndex, dataProviderIndex);
                assert.equal(aDataProvider, newDataProvider);

                // Validating events were emitted
                atmGovernance
                    .dataProviderUpdated(result)
                    .emitted(sender, dataTypeIndex, dataProviderIndex, oldDataProvider, newDataProvider);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_notContrat: [0, DATA_TYPE_INDEX, 2, 'DATA_PROVIDER_MUST_BE_A_CONTRACT', true],
    }, function (senderIndex, dataTypeIndex, dataProviderIndex, expectedErrorMessage, mustFail) {
        it(t('user', 'updateDataProvider#2', 'Should not be able to update non-contract addresses as data providers.', mustFail), async function () {
           // Setup
           const sender = accounts[senderIndex];
           const dataProviderNotContract = accounts[dataProviderIndex];
           const validSender = accounts[0];
            const dataProviderContract = await Mock.new();
            const oldDataProvider = dataProviderContract.address;
            // Precondition
            await instance.addDataProvider(dataTypeIndex, oldDataProvider, { from: validSender });

           try {
               // Invocation
               const result = await instance.updateDataProvider(dataTypeIndex, DATA_PROVIDER_INDEX, dataProviderNotContract, { from: sender });

               // Assertions
               assert(!mustFail, 'It should have failed because data is invalid.');
               assert(result);

           } catch (error) {
               // Assertions
               assert(mustFail);
               assert(error);
               assert.equal(error.reason, expectedErrorMessage);
           }
        });
    });

});