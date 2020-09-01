// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const { atmToken } = require('../utils/events');
const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMToken = artifacts.require('./ATMToken.sol');

contract('ATMTokenSnapshotTest', function (accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let atmSettingsInstance;
    let atmInstance;
    let instance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[1];
    const daoMember2 = accounts[2];

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        atmSettingsInstance = await Mock.new();
        atmInstance = await Mock.new();
        instance = await ATMToken.new();
        await instance.initialize(
                                "ATMToken",
                                "ATMT",
                                18,
                                100000,
                                50,
                                settingsInstance.address,
                                atmInstance.address
                            );
        await settingsInstance.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeATMSettings(),
            atmSettingsInstance.address
        );
    });

    withData({
        _1_snapshot_supply_basic: [daoMember1, 1000, 3, false, undefined, false],
        _1_snapshot_supply_platform_paused: [daoMember1, 1000, 3, true, "ATM_IS_PAUSED", true]
    }, function(
        receipient,
        amount,
        snapshotId,
        isPaused,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'snapshot', 'Should or should not be able to create a snapshot correctly', mustFail), async function() {
            // Setup 
            await atmSettingsInstance.givenMethodReturnBool(
                atmSettingsEncoder.encodeIsATMPaused(),
                isPaused
            );
            
            try {
                // Invocation
                await instance.mint(receipient, amount, { from: daoAgent });
                await instance.mint(receipient, amount, { from: daoAgent });
                const mintResult = await instance.mint(daoMember2, amount, { from: daoAgent });
                const supplyResult = await instance.totalSupplyAt(snapshotId);
                const balanceResult = await instance.balanceOfAt(receipient, snapshotId);
                // Assertions
                assert(!mustFail, 'It should have failed because the snapshot was not created');
                assert.equal(
                    supplyResult,
                    3000,
                    'Supply snapshot was not creaeted correctly!'
                );
                assert.equal(
                    balanceResult,
                    2000,
                    'Balance snapshot was not created correctly!'
                );
                atmToken
                    .snapshot(mintResult)
                    .emitted(snapshotId);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(
                    error.reason,
                    expectedErrorMessage
                    );
            }
        });
    });

})