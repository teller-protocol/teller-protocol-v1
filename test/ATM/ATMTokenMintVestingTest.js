// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS  } = require('../utils/consts');
const { atmToken } = require('../utils/events');

// Smart contracts
const ATMToken = artifacts.require("./ATMToken.sol");

contract('ATMTokenMintVestingTest', function (accounts) {
    let instance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];
    const daoMember2 = accounts[3];

    beforeEach('Setup for each test', async () => {
        instance = await ATMToken.new(10000);
    });

    withData({
        _1_mint_vesting_basic: [daoMember2, 1000, 7000, undefined, false],
        _2_mint_vesting_above_cap: [daoMember2, 21000, 7000, 'ERC20_CAP_EXCEEDED', true],
        _3_mint_vesting_zero_address: [NULL_ADDRESS, 3000, 60000, "MINT_TO_ZERO_ADDRESS", true],
        _4_mint_vesting_incorrect_address: [daoMember1, 1000, 7000, 'ACCOUNT_DOESNT_HAVE_VESTING', true],
    },function(
        receipent,
        amount,
        vestingPeriod,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'mintVesting', 'Should or should not be able to mint correctly', mustFail), async function() {

            try {
                // Invocation
                let vested;
                const result = await instance.mintVesting(receipent, amount, vestingPeriod, { from: daoAgent });
                if (receipent == daoMember1) {
                    vested = await instance.isVested(daoMember2);
                } else {
                    vested = await instance.isVested(receipent);
                }
                // Assertions
                assert(!mustFail, 'It should have failed because the amount is greater than the cap');
                assert(vested);
                atmToken
                    .newVesting(result)
                    .emitted(receipent, amount, vestingPeriod);
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