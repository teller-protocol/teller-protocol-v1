// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');
const { settings } = require('../utils/events');
const { createTestSettingsInstance } = require('../utils/settings-helper');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsSetEscrowFactoryTest', function (accounts) {
    const owner = accounts[0];
    let instance;
    let mocks;
    
    beforeEach('Setup for each test', async () => {
        instance = await createTestSettingsInstance(Settings);
        mocks = await createMocks(Mock, 10);
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [0, 2, false, undefined, false],
        _2_paused: [0, 3, true, "Pausable: paused", true],
        _3_notOwner: [2, 4, false, 'PauserRole: caller does not have the Pauser role', true],
        _4_empty: [0, -1, false, 'NEW_ADDRESS_MUST_BE_CONTRACT', true],
        _5_not_contract: [0, 99, false, 'NEW_ADDRESS_MUST_BE_CONTRACT', true],
        _6_same: [0, 100, false, 'NEW_ADDRESS_MUST_BE_NEW', true],
    }, function(senderIndex, newEscrowFactoryIndex, pause, expectedErrorMessage, mustFail) {
        it(t('user', 'setEscrowFactory', 'Should (or not) be able to set the platform escrow factory.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            if (newEscrowFactoryIndex === 100) {
                const currentEscrowFactory = await Mock.new();
                await instance.setEscrowFactory(currentEscrowFactory.address, { from: owner });
            }
            const settingsEscrowFactoryAddressOld = await instance.escrowFactory();
            const newEscrowFactoryAddress = newEscrowFactoryIndex === 100 ? settingsEscrowFactoryAddressOld : getInstance(mocks, newEscrowFactoryIndex, 2);
            if (pause) {
                await instance.pause();
            }

            try {
                // Invocation
                const result = await instance.setEscrowFactory(newEscrowFactoryAddress, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                const settingsEscrowFactoryAddress = await instance.escrowFactory();
                assert.equal(
                    newEscrowFactoryAddress.toLowerCase(),
                    settingsEscrowFactoryAddress.toLowerCase(),
                    'Escrow factory address was not set properly.'
                );

                settings
                    .escrowFactoryUpdated(result)
                    .emitted(sender, settingsEscrowFactoryAddressOld, newEscrowFactoryAddress);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});