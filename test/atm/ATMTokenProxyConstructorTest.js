// JS Libraries
const ATMTokenEncoder = require("../utils/encoders/ATMTokenEncoder");
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMToken = artifacts.require('./base/atm/ATMToken.sol');
const ATMTokenProxy = artifacts.require('./base/atm/ATMTokenProxy.sol');

contract('ATMTokenProxyConstructorTest', function (accounts) {
    const encoder = new ATMTokenEncoder(web3)
    let atmToken
    let atmGovernance;
    let atmSettings

    beforeEach(async () => {
        atmToken = await ATMToken.new();
        atmGovernance = await Mock.new();

        atmSettings = await Mock.new();
        await atmSettings.givenMethodReturnAddress(
            encoder.encodeAtmTokenLogic(),
            atmToken.address
        );
    })

    withData({
        _1_initialize_basic: ['ATMToken', 'ATMT', 18, 10000, 50],
    }, function (
        name,
        symbol,
        decimals,
        cap,
        maxVesting,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'constructor', 'Should be able to create and initialize contract.', mustFail), async function() {
            // Setup
            try {
                const proxy = await ATMTokenProxy.new(name, symbol, decimals, cap, maxVesting, atmSettings.address, atmGovernance.address)
                const atmToken = await ATMToken.at(proxy.address)

                // Assertions
                const isInitialized = await atmToken.initialized.call()
                assert(isInitialized, 'Contract not initialized.')

                const atmSettingsAddress = await atmToken.atmSettings.call()
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