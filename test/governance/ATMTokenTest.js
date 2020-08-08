// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS  } = require('../utils/consts');
const Timer = require('../../scripts/utils/Timer');

// Smart contracts
const ATMToken = artifacts.require("./ATMToken.sol");

contract('ATMTokenTest', function (accounts) {
    let instance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];
    const daoMember2 = accounts[3];
    const timer = new Timer(web3);

    beforeEach('Setup for each test', async () => {
        instance = await ATMToken.new(10000);
    });

    withData({
        _1_mint_no_vesting_basic: [daoMember1, 2000, undefined, false],
        _2_mint_no_vesting_above_cap: [daoMember1, 11000, 'ERC20Capped: cap exceeded', true],
        _3_mint_no_vesting_zero_address: [NULL_ADDRESS, 3000, "ERC20: mint to the zero address", true]
    },function(
        receipent,
        amount,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'mint', 'Should or should not be able to mint correctly', mustFail), async function() {

            try {
                // Invocation
                const result = await instance.mint(receipent, amount, { from: daoAgent });
                // Assertions
                assert(!mustFail, 'It should have failed because the amount is greater than the cap');
                assert(result);
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

    withData({
        _4_mint_vesting_basic: [daoMember2, 1000, 7000, undefined, false],
        _5_mint_vesting_above_cap: [daoMember2, 21000, 7000, 'ERC20Capped: cap exceeded', true],
        _6_mint_vesting_zero_address: [NULL_ADDRESS, 3000, 60000, "ERC20: mint to the zero address", true],
        _7_mint_vesting_incorrect_address: [daoMember1, 1000, 7000, 'Account does not have a vesting balance!', true],
    },function(
        receipent,
        amount,
        vestingPeriod,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'mint', 'Should or should not be able to mint correctly', mustFail), async function() {

            try {
                // Invocation
                let result;
                await instance.mintVesting(receipent, amount, vestingPeriod, { from: daoAgent });
                if (receipent == daoMember1) {
                    result = await instance.isVested(daoMember2);
                } else {
                    result = await instance.isVested(receipent);
                }
                // Assertions
                assert(!mustFail, 'It should have failed because the amount is greater than the cap');
                assert(result);
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

    withData({
        _8_set_supply_cap_basic: [70000, daoAgent, undefined, false],
        _9_set_supply_cap_invalid_sender: [100000, daoMember1, 'PauserRole: caller does not have the Pauser role', true]
    },function(
        newCap,
        sender,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'mint', 'Should or should not be able to set cap correctly', mustFail), async function() {

            try {
                // Invocation
                await instance.setCap(newCap, { from: sender });
                const result = await instance.cap();
                // Assertions
                assert(!mustFail, 'It should have failed because the sender is invalid');
                assert(result);
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

    withData({
        _10_claim_vested_basic: [daoMember2, 1000, 7000, 7001, undefined, false],
        _11_claim_vested_before_deadline: [daoMember2, 1000, 7000, 5000, 'Vesting deadline has not passed', true],
        _12_claim_vested_no_amount: [daoMember1, 1000, 7000, 8000, 'Account does not have a vesting balance!', true]
    },function(
        receipent,
        amount,
        vestingPeriod,
        claimTime,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'mint', 'Should or should not be able to claim correctly', mustFail), async function() {

            try {
                // Invocation
                await instance.mintVesting(daoMember2, amount, vestingPeriod, { from: daoAgent });
                const currentTime = await timer.getCurrentTimestampInSeconds();
                await timer.advanceBlockAtTime(currentTime + claimTime);
                const result = await instance.withdrawVested({ from: receipent });
                // Assertions
                assert(!mustFail, 'It should have failed because the account is not vested');
                assert(result);
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

    withData({
        _13_revoke_vested_basic: [daoMember1, 1000, 7000, undefined, false],
        _14_revoke_vested_no_amount: [daoMember2, 1000, 7000, "Account does not have a vesting balance!", true]
        
    },function(
        receipent,
        amount,
        vestingPeriod,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'mint', 'Should or be able to revoke correctly', mustFail), async function() {

            try {
                // Invocation
                await instance.mintVesting(daoMember1, amount, vestingPeriod, { from: daoAgent });
                const result = await instance.revokeVesting(receipent, { from: daoAgent });
                // Assertions
                assert(!mustFail, 'It should have failed because the account is not vested');
                assert(result);
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