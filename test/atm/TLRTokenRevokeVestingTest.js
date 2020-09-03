// JS Libraries
const withData = require('leche').withData;
const { t  } = require('../utils/consts');
const { tlrToken } = require('../utils/events');
const Timer = require('../../scripts/utils/Timer');
const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

 // Mock contracts
 const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TLRToken = artifacts.require("./TLRToken.sol");

contract('TLRTokenRevokeVestingTest', function (accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let settingsInstance;
    let atmSettingsInstance;
    let atmInstance;
    let instance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];
    const daoMember2 = accounts[3];
    const timer = new Timer(web3);

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        atmSettingsInstance = await Mock.new();
        atmInstance = await Mock.new();
        instance = await TLRToken.new();
        await instance.initialize(
                            "Teller Token",
                            "TLR",
                            18,
                            10000,
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
        _1_revoke_vested_basic: [true, daoAgent, daoMember1, 1000, 3000, 7000, undefined, false],
        _2_revoke_vested_no_amount: [true, daoAgent, daoMember2, 1000, 1750, 7000, "ACCOUNT_DOESNT_HAVE_VESTING", true],
        _3_revoke_vested_invalid_sender: [false, daoMember1, daoMember2, 1000, 1750, 7000, "NOT_PAUSER", true],
    },function(
        senderHasPauserRole,
        sender,
        receipent,
        amount,
        cliff,
        vestingPeriod,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'revokeVesting', 'Should or be able to revoke correctly', mustFail), async function() {
            // Setup
            await instance.mintVesting(daoMember1, amount, cliff, vestingPeriod, { from: daoAgent });
            const deadline = await timer.getCurrentTimestampInSecondsAndSum(vestingPeriod);
            await atmSettingsInstance.givenMethodReturnBool(
                atmSettingsEncoder.encodeIsATMPaused(),
                false
            );
            if(!senderHasPauserRole) {
                await settingsInstance.givenMethodRevertWithMessage(
                    settingsInterfaceEncoder.encodeRequirePauserRole(),
                    "NOT_PAUSER"
                );
            }

            try {
                // Invocation
                const result = await instance.revokeVesting(receipent, 0, { from: sender });
                // Assertions
                assert(!mustFail, 'It should have failed because the account is not vested');
                tlrToken
                    .revokeVesting(result)
                    .emitted(receipent, amount, deadline);
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