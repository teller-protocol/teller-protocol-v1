// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Mock contracts

// Smart contracts
const TInitializable = artifacts.require("./mock/base/TInitializableModifiersMock.sol");

contract('InitializeModifiersTest', function (accounts) {
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await TInitializable.new();
    });

    withData({
        _1_notInitialized: [false, undefined, false],
        _2_initialized: [true, "CONTRACT_ALREADY_INITIALIZED", true],
    }, function(
        callInitialize,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'isNotInitialized', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            if(callInitialize) {
                await instance.externalInitialize();
            }

            try {
                // Invocation
                const result = await instance.externalIsNotInitialized();
                
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

    withData({
        _1_initialized: [true, undefined, false],
        _2_notInitialized: [false, "CONTRACT_NOT_INITIALIZED", true],
    }, function(
        callInitialize,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'isInitialized', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            if(callInitialize) {
                await instance.externalInitialize();
            }

            try {
                // Invocation
                const result = await instance.externalIsInitialized();
                
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