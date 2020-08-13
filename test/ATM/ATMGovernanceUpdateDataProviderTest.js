// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { atmGovernance } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMGovernance = artifacts.require("./ATM/ATMGovernance.sol");

contract('ATMGovernanceUpdateDataProviderTest', function (accounts) {
    let instance;

    beforeEach('Setup for each test', async () => {
        instance = await ATMGovernance.new();
    });

    // Testing values
    const DATA_TYPE_INDEX = 1;
    const FIRST_DATA_PROVIDER_POSITION = 0;

    withData({
        _1_basic: [0, DATA_TYPE_INDEX, false, undefined, false],
        _2_notSigner: [2, DATA_TYPE_INDEX, false, 'SignerRole: caller does not have the Signer role', true],
        _3_sameOldProvider: [0, DATA_TYPE_INDEX, true, 'DATA_PROVIDER_SAME_OLD', true],
     }, function (senderIndex, dataTypeIndex, repeatProvider, expectedErrorMessage, mustFail) {
        it(t('user', 'updateDataProvider#1', 'Should (or not) be able to update a data provider.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            const validSender = accounts[0];
            const dataProviderContract = await Mock.new();
            const oldDataProvider = dataProviderContract.address;
            const newDataProviderContract = await Mock.new();
            let newDataProvider = newDataProviderContract.address;
            // Precondition
            await instance.addDataProvider(dataTypeIndex, oldDataProvider, { from: validSender });
            if (repeatProvider) {
                newDataProvider = oldDataProvider;
            }
            try {

                // Invocation
                const result = await instance.updateDataProvider(dataTypeIndex, FIRST_DATA_PROVIDER_POSITION, newDataProvider, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were modified
                const aDataProvider = await instance.getDataProvider(dataTypeIndex, FIRST_DATA_PROVIDER_POSITION);
                assert.equal(aDataProvider, newDataProvider);

                // Validating events were emitted
                atmGovernance
                    .dataProviderUpdated(result)
                    .emitted(sender, dataTypeIndex, oldDataProvider, newDataProvider);

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
           const dataProvider = accounts[dataProviderIndex];
           try {
               // Invocation
               const result = await instance.updateDataProvider(dataTypeIndex, FIRST_DATA_PROVIDER_POSITION, dataProvider, { from: sender });

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