// JS Libraries
const withData = require('leche').withData;
const { t, encode } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMGovernance = artifacts.require('./base/atm/ATMGovernance.sol');
const ATMGovernanceProxy = artifacts.require('./base/atm/ATMGovernanceProxy.sol');

contract('ATMGovernanceProxyConstructorTest', function (accounts) {
    let atmGovernance
    let atmSettings

    beforeEach(async () => {
        atmGovernance = await ATMGovernance.new();

        atmSettings = await Mock.new();
        await atmSettings.givenMethodReturnAddress(
            encode(web3, 'atmGovernanceLogic()'),
            atmGovernance.address
        );
    })

    withData({
        _1_initialize_basic: [accounts[0]],
    }, function (
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'constructor', 'Should be able to create and initialize contract.', mustFail), async function() {
            // Setup
            try {
                const proxy = await ATMGovernanceProxy.new(atmSettings.address)
                const atmGovernance = await ATMGovernance.at(proxy.address)

                // Assertions
                const isInitialized = await atmGovernance.initialized.call()
                assert(isInitialized, 'Contract not initialized.')

                const atmSettingsAddress = await atmGovernance.atmSettings.call()
                assert.equal(atmSettings.address, atmSettingsAddress, 'ATMSettings address not set.')
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }   
        });
    });
});