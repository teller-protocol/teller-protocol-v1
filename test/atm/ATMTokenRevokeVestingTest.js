// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS  } = require('../utils/consts');
const { atmToken } = require('../utils/events');
const Timer = require('../../scripts/utils/Timer');
const SettingsInterfaceEncoder = require('../utils/encoders/settingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMToken = artifacts.require("./ATMToken.sol");

contract('ATMTokenRevokeVestingTest', function (accounts) {
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let instance;
    let settingsInstance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];
    const daoMember2 = accounts[3];
    const timer = new Timer(web3);

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        instance = await ATMToken.new(
                                    "ATMToken",
                                    "ATMT",
                                    18,
                                    100000,
                                    50,
                                    settingsInstance.address
                            );
    });

    withData({
        _1_revoke_vested_basic: [daoMember1, 1000, 3000, 7000, undefined, false],
        _2_revoke_vested_no_amount: [daoMember2, 1000, 1750, 7000, "ACCOUNT_DOESNT_HAVE_VESTING", true]
        
    },function(
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
        await settingsInstance.givenMethodReturnBool(
            settingsInterfaceEncoder.encodeIsPaused(),
            false
        );

            try {
                // Invocation
                const result = await instance.revokeVesting(receipent, 0, { from: daoAgent });
                // Assertions
                assert(!mustFail, 'It should have failed because the account is not vested');
                atmToken
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