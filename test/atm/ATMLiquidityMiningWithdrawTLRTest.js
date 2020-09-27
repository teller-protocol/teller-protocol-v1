// JS Libraries
const helper = require("../utils/time-block-helper");
const withData = require("leche").withData;
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { t, toBytes32 } = require("../utils/consts");
const { assert } = require("chai");
const { liquidityMining } = require("../utils/events");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TDAI = artifacts.require("./base/TDAI.sol");
const Settings = artifacts.require("./base/Settings.sol");
const TLRToken = artifacts.require("./atm/TLRToken.sol");
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
const ATMLiquidityMiningMock = artifacts.require("./atm/ATMLiquidityMiningMock.sol");

contract("ATMLiquidityMiningWithdrawTLRTest", function(accounts) {
    const owner = accounts[0]; 
    const user = accounts[2];
    const INITIAL_REWARD = 1;
    let instance;
    let governance;
    let tlr;

    const SETTING_NAME = toBytes32(web3, 'MIN_TLR_TO_REDEEM');
    const SETTING_VALUE = 3;
    
    
    beforeEach("Setup for each test", async () => {
        //const settingsInstance = await Mock.new();
        //const settingsInstance = await Settings.new();
        const settingsInstance = await createTestSettingsInstance(Settings, { from: owner, Mock });
            
        governance = await ATMGovernance.new();
        await governance.initialize(settingsInstance.address, owner, INITIAL_REWARD);
        await governance.addGeneralSetting(SETTING_NAME, SETTING_VALUE, { from: owner });
        tlr = await TLRToken.new({ from: owner });
        tToken = await TDAI.new();
        instance = await ATMLiquidityMiningMock.new(); // Used to expose/test internal methods
        //await tlr.initialize("name", "symbol", 10, { from: owner });
        //await tlr.addMinter(instance.address, { from: owner });
        await instance.initialize(settingsInstance.address, governance.address, tlr.address, { from: owner });
    });

    withData({
        _1_basic: [ 10, SETTING_VALUE + 2, 0, false, undefined ],
        //_2_not_enough_tTokens: [ 10, 5, 1, true, "INSUFFICIENT_TTOKENS_TO_STAKE" ],
    }, function(stakeAmount, withdrawAmount, offset, mustFail, expectedErrorMessage) {
        it(t("user", "withdrawTLR", "Should be able or not to withdraw TLR tokens.", mustFail), async function() {
            // Setup
            await tToken.mint(user, stakeAmount, { from: owner });
            await tToken.approve(instance.address, stakeAmount, { from: user });
            await instance.stake(tToken.address, stakeAmount + offset , { from: user });
            await helper.advanceBlocks(1000);
            try {
                // Invocation 
                const userTLRBalanceBefore = await tlr.balanceOf(user);
    console.log(userTLRBalanceBefore);
                const tlrBalance = await instance.getTLRBalance.call({ from: user});
    console.log(tlrBalance);
                const result = await instance.withdrawTLR(withdrawAmount, { from: user });
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                // Validating result
                const userTLRBalanceAfter = await tlr.balanceOf(user);
                assert(parseInt(userTLRBalanceAfter) > parseInt(userTLRBalanceBefore), 'user TLR not minted.');
                // Validating events were emitted
                liquidityMining
                    .withdrawTLR(result)
                    .emitted(user, withdrawAmount, result.receipt.blockNumber, stakeAmount);
                assert(false);
            } catch (error) {
                console.log(error);
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
/*    
    withData({
        _1_one_reward_multi_stake: [ [10, 20, 30, 5, 3], false, undefined ],
    }, function(amounts, mustFail, expectedErrorMessage) {
        it(t("user", "stake#2-one-reward-multiple-stakes", "Should be able or not to stake tTokens.", mustFail), async function() {
            try {
                // Setup
                let totalAmount = 0;
                let userBalanceBefore = 0;
                let liquidityBalanceAfter = 0;
                for (let i = 0; i < amounts.length; i++) {
                    totalAmount += parseInt(amounts[i]);
                    await tToken.mint(user, amounts[i], { from: owner });
                    await tToken.approve(instance.address, totalAmount, { from: user });
                    userBalanceBefore += parseInt(await tToken.balanceOf(user));
                    // Invocation 
                    const result = await instance.stake(tToken.address, amounts[i] , { from: user });
                    // Assertions
                    assert(!mustFail, 'It should have failed because data is invalid.');
                    // Validating result
                    liquidityBalanceAfter = parseInt(await tToken.balanceOf(instance.address)) ;
                    // Validating events were emitted
                    liquidityMining
                        .stake(result)
                        .emitted(user, tToken.address, amounts[i], result.receipt.blockNumber, totalAmount); // accruedTLR validated on calculateAccruedTLR test.
                }
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
    
    withData({
        _1_multi_reward_multi_stake: [ [10, 100], [20, 200, 2000], false, undefined ],
    }, function(amounts, rewards, mustFail, expectedErrorMessage) {
        it(t("user", "stake#3-multiple-rewards-multiple-stakes", "Should be able or not to stake tTokens.", mustFail), async function() {
            // Setup
            await tToken.mint(user, amounts[0], { from: owner });
            await tToken.approve(instance.address, amounts[0], { from: user });
            await instance.stake(tToken.address, amounts[0] , { from: user });
            const totalAmount = amounts[0] + amounts[1];        
            for (let r = 0; r < rewards.length; r++){
                await helper.advanceBlocks(rewards[r]);
                await governance.addTLRReward(rewards[r], { from: owner});
            }
            await tToken.mint(user, amounts[1], { from: owner });
            await tToken.approve(instance.address, totalAmount, { from: user });
            
            try {
                // Invocation 
                const result = await instance.stake(tToken.address, amounts[1] , { from: user });
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                // Validating result
                liquidityBalanceAfter = parseInt(await tToken.balanceOf(instance.address)) ;
                assert( liquidityBalanceAfter == totalAmount);
                // Validating events were emitted
                liquidityMining
                    .stake(result)
                    .emitted(user, tToken.address, amounts[1], result.receipt.blockNumber, totalAmount); // accruedTLR validated on calculateAccruedTLR test.
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
    */
});
