// JS Libraries
const withData = require('leche').withData;
const { t, toBytes32 } = require('../utils/consts');
const { settings } = require('../utils/events');
const { createTestSettingsInstance } = require('../utils/settings-helper');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsCreateComponentVersionTest', function (accounts) {
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await createTestSettingsInstance(Settings);
    });

    withData({
        _1_basic: [0, 'newComponent', 12345, undefined, false],
        _2_notOwner: [2, 'NewNodeComponent', 3, 'PauserRole: caller does not have the Pauser role', true],
        _3_emptyComponentName: [0, '', 1, 'COMPONENT_NAME_MUST_BE_PROVIDED', true],
        _4_invalidComponentVersion: [0, 'NewNodeComponent', 0, 'INVALID_COMPONENT_VERSION', true],
    }, function(senderIndex, componentName, minComponentVersion, expectedErrorMessage, mustFail) {
        it(t('Pauser user', 'createComponentVersion', 'Should (or not) be able to add a new component version.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const byteComponentName = toBytes32(web3, componentName);
            try {
                // Invocation
                const result = await instance.createComponentVersion(byteComponentName, minComponentVersion, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were stored
                const componentVersion = await instance.getComponentVersion(byteComponentName);
                assert.equal(componentVersion, minComponentVersion);

                // Validating events were emitted
                settings
                    .createComponentVersion(result)
                    .emitted(sender, byteComponentName, minComponentVersion);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_duplicatedComponent: [0, 'newComponent', 12345],
    }, function(senderIndex, componentName, minComponentVersion) {
        it(t('Pauser user', 'createComponentVersion#2', 'Should NOT be able to add a new component version twice.', true), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const byteComponentName = toBytes32(web3, componentName);
            await instance.createComponentVersion(byteComponentName, minComponentVersion, { from: sender });
            
            try {
                // Invocation
                await instance.createComponentVersion(byteComponentName, minComponentVersion, { from: sender });
                
                // Assertions
                fail('It should have failed because data is invalid.');
            } catch (error) {
                // Assertions
                assert(error);
                assert.equal(error.reason, 'COMPONENT_ALREADY_EXISTS');
            }
        });
    });

    withData({
        _1_dontHaltOnPause: [0, 'newComponent', 12345, undefined, false],
    }, function(senderIndex, componentName, minComponentVersion, expectedErrorMessage, mustFail) {
        it(t('Pauser user', 'createComponentVersion#3', 'Should be able to add a new component version while PAUSED.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const byteComponentName = toBytes32(web3, componentName);
            // Pausing Settings contract
            await instance.pause();

            try {
                // Invocation
                const result = await instance.createComponentVersion(byteComponentName, minComponentVersion, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were stored
                const componentVersion = await instance.getComponentVersion(byteComponentName);
                assert.equal(componentVersion, minComponentVersion);

                // Validating events were emitted
                settings
                    .createComponentVersion(result)
                    .emitted(sender, byteComponentName, minComponentVersion);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});