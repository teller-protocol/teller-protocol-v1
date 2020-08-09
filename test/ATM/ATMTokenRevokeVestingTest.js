// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS  } = require('../utils/consts');
const { atmToken } = require('../utils/events');
const Timer = require('../../scripts/utils/Timer');

// Smart contracts
const ATMToken = artifacts.require("./ATMToken.sol");

contract('ATMTokenRevokeVestingTest', function (accounts) {
    let instance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];
    const daoMember2 = accounts[3];
    const timer = new Timer(web3);

    beforeEach('Setup for each test', async () => {
        instance = await ATMToken.new(10000);
    });

    withData({
        _1_revoke_vested_basic: [daoMember1, 1000, 7000, undefined, false],
        _2_revoke_vested_no_amount: [daoMember2, 1000, 7000, "ACCOUNT_DOESNT_HAVE_VESTING", true]
        
    },function(
        receipent,
        amount,
        vestingPeriod,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'revokeVesting', 'Should or be able to revoke correctly', mustFail), async function() {
        // Setup
        await instance.mintVesting(daoMember1, amount, vestingPeriod, { from: daoAgent });
        const deadline = await timer.getCurrentTimestampInSecondsAndSum(vestingPeriod);
            try {
                // Invocation
                const result = await instance.revokeVesting(receipent, { from: daoAgent });
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