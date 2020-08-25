// JS Libraries
const IATMSettingsEncoder = require("../utils/encoders/IATMSettingsEncoder");
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMGovernance = artifacts.require('./base/atm/ATMGovernance.sol');
const ATMGovernanceProxy = artifacts.require('./base/atm/ATMGovernanceProxy.sol');

contract('ATMGovernanceProxyConstructorTest', function (accounts) {
    const encoder = new IATMSettingsEncoder(web3)
    let atmGovernance
    let atmSettings

    beforeEach(async () => {
        atmGovernance = await ATMGovernance.new();

        atmSettings = await Mock.new();
        await atmSettings.givenMethodReturnAddress(
            encoder.encodeAtmGovernanceLogic(),
            atmGovernance.address
        );
    })

    withData({
        _1_initialize_basic: [null, false],
    }, function (
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'constructor', 'Should be able to create and initialize contract.', mustFail), async function() {
            // Setup
            try {
                // Invocation
                const proxy = await ATMGovernanceProxy.new(atmSettings.address)

                // Assertions
                const atmGovernance = await ATMGovernance.at(proxy.address)
                assert(!mustFail, 'It should have failed because data is invalid.')
                const isInitialized = await atmGovernance.initialized()
                assert(isInitialized, 'Contract not initialized.')

                const atmSettingsAddress = await atmGovernance.atmSettings()
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