// JS Libraries
const withData = require('leche').withData;
const { t, createMocks } = require('../utils/consts');
const { atmSettings } = require('../utils/events');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");

contract('ATMSettingsRemoveATMToMarketTest', function (accounts) {
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    const owner = accounts[0];
    let instance;
    let settings;
    let mocks;
    
    beforeEach('Setup for each test', async () => {
        mocks = await createMocks(Mock, 10);

        settings = await Mock.new();
        await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeHasPauserRole(), true);
        await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeIsPaused(), false);

        const atmTokenLogic = await Mock.new();
        const atmGovernanceLogic = await Mock.new();
        instance = await ATMSettings.new(settings.address, atmTokenLogic.address, atmGovernanceLogic.address);
    });

    const newAtM = (borrowedTokenIndex, collateralTokenIndex, atmAddressIndex) => ({borrowedTokenIndex, collateralTokenIndex, atmAddressIndex});

    withData({
        _1_basic: [[newAtM(0, 1, 2)], newAtM(0, 1, 2), 0, true, true, false, undefined, false],
        _2_invalid_not_exist: [[newAtM(0, 1, 2)], newAtM(1, 1, 2), 0, true, true, false, 'ATM_TO_MARKET_NOT_EXIST', true],
        _3_borrowed_token_not_contract: [[newAtM(3, 1, 0)], newAtM(99, 2, 3), 0, true, true, false, 'BORROWED_TOKEN_MUST_BE_CONTRACT', true],
        _4_collateral_token_not_contract: [[newAtM(3, 1, 0)], newAtM(1, 99, 3), 0, true, true, false, 'COLL_TOKEN_MUST_BE_CONTRACT', true],
        _5_sender_not_pauser: [[newAtM(2, 3, 1)], newAtM(2, 3, 1), 1, true, false, false, 'ONLY_PAUSER', true],
    }, function(previousATMToMarkets, atmToMarket, senderIndex, encodeIsATM, encodeHasPauserRole, encodeIsPaused, expectedErrorMessage, mustFail) {
        it(t('user', 'removeATMToMarket', 'Should (or not) be able to remove an ATM from a market.', mustFail), async function() {
            // Setup
            for (const previousATMIndex of previousATMToMarkets) {
                await instance.setATMToMarket(
                    mocks[previousATMIndex.borrowedTokenIndex],
                    mocks[previousATMIndex.collateralTokenIndex],
                    mocks[previousATMIndex.atmAddressIndex],
                    { from: owner }
                );
            }
            const sender = accounts[senderIndex];
            await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeHasPauserRole(), encodeHasPauserRole);
            await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeIsPaused(), encodeIsPaused);
            const borrowedToken = atmToMarket.borrowedTokenIndex === 99 ? accounts[0] : mocks[atmToMarket.borrowedTokenIndex];
            const collateralToken = atmToMarket.collateralTokenIndex === 99 ? accounts[1] : mocks[atmToMarket.collateralTokenIndex];

            try {
                // Invocation
                const result = await instance.removeATMToMarket(
                    borrowedToken,
                    collateralToken,
                    { from: sender }
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');

                const atmAddress = mocks[atmToMarket.atmAddressIndex];
                const isATMForMarketResult = await instance.isATMForMarket(borrowedToken, collateralToken, atmAddress);
                assert.equal(isATMForMarketResult, false);

                atmSettings
                    .marketToAtmRemoved(result)
                    .emitted(borrowedToken, collateralToken, atmAddress, sender);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});