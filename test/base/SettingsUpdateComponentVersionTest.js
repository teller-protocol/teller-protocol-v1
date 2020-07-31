// JS Libraries
const withData = require('leche').withData;
const { t, toBytes32 } = require('../utils/consts');
const { settings } = require('../utils/events');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsUpdateComponentVersionTest', function (accounts) {
    let instance;
    const COMPONENT_NAME = 'ComponentName';
    const INITIAL_VERSION = 12;

    beforeEach('Setup for each test', async () => {
        instance = await Settings.new(1, 1, 1, 1, 1, 1, 1);
        // Adding the component we will update
        instance.addNewComponent(toBytes32(web3, COMPONENT_NAME), INITIAL_VERSION);
    });

    withData({
        _1_basic: [0, COMPONENT_NAME, 123, undefined, false],
        _2_notOwner: [2, COMPONENT_NAME, 123, 'PauserRole: caller does not have the Pauser role', true],
        _3_emptyComponentName: [0, '', 123, 'MISSING_COMPONENT_NAME', true],
        _4_componentNotFound: [0, 'otherComponent', 123, 'COMPONENT_NOT_FOUND', true],
        _5_invalidComponentVersion: [0, COMPONENT_NAME, 0,'INVALID_COMPONENT_MINIMUM_VERSION', true],
        _6_sameComponentVersion: [0, COMPONENT_NAME, INITIAL_VERSION, 'PREVIOUS_AND_NEW_VERSION_ARE_EQUAL', true],
    }, function(senderIndex, componentName, newMinComponentVersion, expectedErrorMessage, mustFail) {
        it(t('user', 'updateComponentVersion', 'Should (or not) be able to add a new node component.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const byteComponentName = toBytes32(web3, componentName);
            try {
                // Invocation
                const result = await instance.updateComponentVersion(byteComponentName, newMinComponentVersion, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating successful update
                const componentVersion = await instance.minimumNodeRequirements(byteComponentName);
                assert.equal(componentVersion, newMinComponentVersion);
                
                // Validating events emmited
                settings
                    .updateComponentVersion(result)
                    .emitted(sender, byteComponentName, INITIAL_VERSION, newMinComponentVersion);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

});