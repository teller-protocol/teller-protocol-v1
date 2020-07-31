// JS Libraries
const withData = require('leche').withData;
const { t, toBytes32 } = require('../utils/consts');
const { settings } = require('../utils/events');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsAddNewComponentTest', function (accounts) {
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await Settings.new(1, 1, 1, 1, 1, 1, 1);
    });

    withData({
        _1_basic: [0, 'newComponent', 12345, undefined, false],
        _2_notOwner: [2, 'NewNodeComponent', 3, 'PauserRole: caller does not have the Pauser role', true],
        _3_emptyComponentName: [0, '', 1, 'MISSING_COMPONENT_NAME', true],
        _4_invalidComponentVersion: [0, 'NewNodeComponent', 0, 'INVALID_COMPONENT_MINIMUM_VERSION', true],
    }, function(senderIndex, componentName, minComponentVersion, expectedErrorMessage, mustFail) {
        it(t('user', 'addNewComponent', 'Should (or not) be able to add a new node component.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const byteComponentName = toBytes32(web3, componentName);
            try {
                // Invocation
                const result = await instance.addNewComponent(byteComponentName, minComponentVersion, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were stored
                const componentVersion = await instance.minimumNodeRequirements(byteComponentName);
                assert.equal(componentVersion, minComponentVersion);

                // Validating events were emitted
                settings
                    .addNewComponent(result)
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
        it(t('user', 'addNewComponent#2', 'Should NOT be able to add a new node component twice.', true), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const byteComponentName = toBytes32(web3, componentName);
            await instance.addNewComponent(byteComponentName, minComponentVersion, { from: sender });
            
            try {
                // Invocation
                await instance.addNewComponent(byteComponentName, minComponentVersion, { from: sender });
                
                // Assertions
                fail('It should have failed because data is invalid.');
            } catch (error) {
                // Assertions
                assert(error);
                assert.equal(error.reason, 'COMPONENT_ALREADY_EXISTS');
            }
        });
    });
});