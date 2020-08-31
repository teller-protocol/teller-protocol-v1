// JS Libraries
const TLRTokenEncoder = require("../utils/encoders/TLRTokenEncoder");
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TLRToken = artifacts.require('./base/atm/TLRToken.sol');
const TLRTokenProxy = artifacts.require('./base/atm/TLRTokenProxy.sol');

contract('TLRTokenProxyConstructorTest', function (accounts) {
    const encoder = new TLRTokenEncoder(web3)
    let tlrToken
    let atmGovernance;
    let atmSettings

    beforeEach(async () => {
        tlrToken = await TLRToken.new();
        atmGovernance = await Mock.new();

        atmSettings = await Mock.new();
        await atmSettings.givenMethodReturnAddress(
            encoder.encodeTlrTokenLogic(),
            tlrToken.address
        );
    })

    withData({
        _1_initialize_basic: ['Teller Token', 'TLR', 18, 10000, 50],
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
                const proxy = await TLRTokenProxy.new(name, symbol, decimals, cap, maxVesting, atmSettings.address, atmGovernance.address)
                const tlrToken = await TLRToken.at(proxy.address)

                // Assertions
                const isInitialized = await tlrToken.initialized.call()
                assert(isInitialized, 'Contract not initialized.')

                const atmSettingsAddress = await tlrToken.atmSettings.call()
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