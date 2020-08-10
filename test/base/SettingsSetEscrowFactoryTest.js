// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, daysToSeconds } = require('../utils/consts');
const { settings } = require('../utils/events');
const { createTestSettingsInstance } = require('../utils/settings-helper');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsSetEscrowFactoryTest', function (accounts) {
    let instance;
    const escrowFactoryAddress = web3.utils.randomHex(20)
    
    beforeEach('Setup for each test', async () => {
        instance = await createTestSettingsInstance(Settings);
    });

    withData({
        _1_basic: [0, false, undefined, false],
        _2_paused: [0, true, "Pausable: paused", true],
        _3_notOwner: [2, false, 'PauserRole: caller does not have the Pauser role', true],
    }, function(senderIndex, pause, expectedErrorMessage, mustFail) {
        it(t('user', 'setEscrowFactory', 'Should (or not) be able to set the platform escrow factory.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];

            try {
                if (pause) await instance.pause()

                const settingsEscrowFactoryAddressOld = await instance.getEscrowFactory();

                // Invocation
                const result = await instance.setEscrowFactory(escrowFactoryAddress, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                const settingsEscrowFactoryAddress = await instance.getEscrowFactory();
                assert.equal(
                  escrowFactoryAddress.toLowerCase(),
                  settingsEscrowFactoryAddress.toLowerCase(),
                  'Escrow factory address was not set properly.'
                );

                settings
                    .escrowFactoryUpdated(result)
                    .emitted(sender, settingsEscrowFactoryAddressOld, settingsEscrowFactoryAddress);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});