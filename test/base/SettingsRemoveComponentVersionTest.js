// JS Libraries
const withData = require('leche').withData;
const { t, toBytes32 } = require('../utils/consts');
const { settings } = require('../utils/events');
const { createTestSettingsInstance } = require('../utils/settings-helper');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsRemoveComponentVersionTest', function (accounts) {
    let instance;
    const COMPONENT_NAME = 'ComponentName';
    const INITIAL_VERSION = 12;
    const NOT_PRESENT = 0;

    beforeEach('Setup for each test', async () => {
        instance = await createTestSettingsInstance(Settings);
        instance.createComponentVersion(toBytes32(web3, COMPONENT_NAME), INITIAL_VERSION);
    });

    withData({
        _1_basic: [0, COMPONENT_NAME, undefined, false],
        _2_notOwner: [2, COMPONENT_NAME, 'PauserRole: caller does not have the Pauser role', true],
        _3_emptyComponentName: [0, '','COMPONENT_NAME_MUST_BE_PROVIDED', true],
        _4_componentNotFound: [0, 'NonExistingComponent','COMPONENT_NOT_FOUND', true],
    }, function(senderIndex, componentName, expectedErrorMessage, mustFail) {
        it(t('Pauser user', 'removeComponentVersion', 'Should (or not) be able to remove a component version.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const byteComponentName = toBytes32(web3, componentName);
            try {
                // Invocation
                const result = await instance.removeComponentVersion(byteComponentName, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                
                // Validating state variables were modified
                const componentVersion = await instance.getComponentVersion(byteComponentName);
                assert.equal(componentVersion, NOT_PRESENT);
                
                // Validating events were emitted
                settings
                    .removeComponentVersion(result)
                    .emitted(sender, byteComponentName, INITIAL_VERSION);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });


    withData({
        _1_dontHaltOnPause: [0, COMPONENT_NAME, undefined, false],
    }, function(senderIndex, componentName, expectedErrorMessage, mustFail) {
        it(t('Pauser user', 'removeComponentVersion#2', 'Should be able to remove a component version while PAUSED.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const byteComponentName = toBytes32(web3, componentName);
            // Pausing Settings contract
            await instance.pause();

            try {
                // Invocation
                const result = await instance.removeComponentVersion(byteComponentName, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                
                // Validating state variables were modified
                const componentVersion = await instance.getComponentVersion(byteComponentName);
                assert.equal(componentVersion, NOT_PRESENT);
                
                // Validating events were emitted
                settings
                    .removeComponentVersion(result)
                    .emitted(sender, byteComponentName, INITIAL_VERSION);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});