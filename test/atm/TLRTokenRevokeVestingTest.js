// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require('leche').withData;
const { t  } = require('../utils/consts');
const { tlrToken } = require('../utils/events');
const Timer = require('../../scripts/utils/Timer');
const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');

 // Mock contracts
 const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TLRToken = artifacts.require("./TLRToken.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('TLRTokenRevokeVestingTest', function (accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    let atmSettingsInstance;
    let atmInstance;
    let instance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];
    const daoMember2 = accounts[3];
    const timer = new Timer(web3);

    beforeEach('Setup for each test', async () => {
        const settings = await createTestSettingsInstance(Settings);
        atmSettingsInstance = await Mock.new();
        await atmSettingsInstance.givenMethodReturnAddress(
            atmSettingsEncoder.encodeSettings(),
            settings.address
        );
        atmInstance = await Mock.new();
        instance = await TLRToken.new();
        await instance.initialize(
                            "Teller Token",
                            "TLR",
                            18,
                            10000,
                            50,
                            atmSettingsInstance.address,
                            atmInstance.address
                        );
    });

    withData({
        _1_revoke_vested_basic: [daoAgent, daoMember1, 1000, 3000, 7000, undefined, false],
        _2_revoke_vested_no_amount: [daoAgent, daoMember2, 1000, 1750, 7000, "ACCOUNT_DOESNT_HAVE_VESTING", true],
        _3_revoke_vested_invalid_sender: [daoMember1, daoMember2, 1000, 1750, 7000, "ONLY_PAUSER", true],
    },function(
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