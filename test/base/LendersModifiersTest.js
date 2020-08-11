// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersModifiersMock.sol");

contract('LendersModifiersTest', function (accounts) {
    
    withData({
        _1_zTokenSender: [accounts[0], accounts[1], accounts[2], accounts[0], undefined, false],
        _2_lendingPoolSender: [accounts[0], accounts[1], accounts[2], accounts[1], 'SENDER_ISNT_ZTOKEN', true],
        _3_consensusSender: [accounts[0], accounts[1], accounts[2], accounts[2], 'SENDER_ISNT_ZTOKEN', true],
        _4_notValidSender: [accounts[0], accounts[1], accounts[2], accounts[3], 'SENDER_ISNT_ZTOKEN', true],
    }, function(
        zTokenAddress,
        lendingPoolAddress,
        consensusAddress,
        sender,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'isZToken', 'Should able (or not) to call function with modifier isZToken.', mustFail), async function() {
            // Setup
            const settingsInstance = await Mock.new();
            const marketsInstance = await Mock.new();
            const instance = await Lenders.new();
            await instance.initialize(zTokenAddress, lendingPoolAddress, consensusAddress, settingsInstance.address, marketsInstance.address);

            try {
                // Invocation
                const result = await instance.externalIsZToken({ from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because the sender has no permissions.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_zTokenSender: [accounts[0], accounts[1], accounts[2], accounts[0], 'SENDER_ISNT_LENDING_POOL', true],
        _2_lendingPoolSender: [accounts[0], accounts[1], accounts[2], accounts[1], undefined, false],
        _3_consensusSender: [accounts[0], accounts[1], accounts[2], accounts[2], 'SENDER_ISNT_LENDING_POOL', true],
        _4_notValidSender: [accounts[0], accounts[1], accounts[2], accounts[3], 'SENDER_ISNT_LENDING_POOL', true],
    }, function(
        zTokenAddress,
        lendingPoolAddress,
        consensusAddress,
        sender,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'isLendingPool', 'Should able (or not) to call function with modifier isLendingPool.', mustFail), async function() {
            // Setup
            const settingsInstance = await Mock.new();
            const marketsInstance = await Mock.new();
            const instance = await Lenders.new();
            await instance.initialize(zTokenAddress, lendingPoolAddress, consensusAddress, settingsInstance.address, marketsInstance.address);

            try {
                // Invocation
                const result = await instance.externalIsLendingPool({ from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because the sender has no permissions.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_validAddress: [accounts[0], accounts[1], accounts[2], accounts[1], undefined, false],
        _2_invalidAddress: [accounts[0], accounts[1], accounts[2], NULL_ADDRESS, 'ADDRESS_IS_REQUIRED', true],
    }, function(
        zTokenAddress,
        lendingPoolAddress,
        consensusAddress,
        sender,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'isValid', 'Should able (or not) to call function with modifier isValid.', mustFail), async function() {
            // Setup
            const settingsInstance = await Mock.new();
            const marketsInstance = await Mock.new();
            const instance = await Lenders.new();
            await instance.initialize(zTokenAddress, lendingPoolAddress, consensusAddress, settingsInstance.address, marketsInstance.address);

            try {
                // Invocation
                const result = await instance.externalIsValid(sender);

                // Assertions
                assert(!mustFail, 'It should have failed because the address is invalid/empty.');
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