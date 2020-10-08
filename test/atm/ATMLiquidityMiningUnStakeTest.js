// JS Libraries
const helper = require("../utils/time-block-helper");
const withData = require("leche").withData;
const { t } = require("../utils/consts");
const { assert } = require("chai");
const { liquidityMining } = require("../utils/events");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TDAI = artifacts.require("./base/TDAI.sol");
const TLRToken = artifacts.require("./atm/TLRToken.sol");
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
const ATMLiquidityMining = artifacts.require("./atm/ATMLiquidityMining.sol");
const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

contract("ATMLiquidityMiningUnStakeTest", function(accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    const owner = accounts[0]; 
    const user = accounts[2];
    const INITIAL_REWARD = 1;
    let instance;
    let governance;
    let tlr;
    let atmSettingsInstance;
    
    beforeEach("Setup for each test", async () => {
        const settingsInstance = await Mock.new();
        atmSettingsInstance = await Mock.new();
        await atmSettingsInstance.givenMethodReturnBool(
            atmSettingsEncoder.encodeIsATMPaused(),
            false
        );
        await settingsInstance.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeATMSettings(),
            atmSettingsInstance.address
        );
        governance = await ATMGovernance.new();
        await governance.initialize(settingsInstance.address, owner, INITIAL_REWARD);
        tlr = await TLRToken.new();
        tToken = await TDAI.new();
        instance = await ATMLiquidityMining.new();
        await instance.initialize(settingsInstance.address, governance.address, tlr.address, { from: owner });
    });

    withData({
        _1_basic: [ 10, 0, false, false, undefined ],
        _2_atm_paused: [ 10, 0, true, true, "ATM_IS_PAUSED" ],
        _3_unstake_zero: [ 0, 0, false, true, "UNSTAKING_ZERO_NOT_ALLOWED" ],        
        _4_not_enough_tTokens: [ 10, 1, false, true, "NOT_ENOUGH_STAKED_TTOKENS" ],
    }, function(amount, offset, isPaused, mustFail, expectedErrorMessage) {
        it(t("user", "unStake#1", "Should be able or not to unStake tTokens.", mustFail), async function() {
            // Setup
            if (amount > 0 ) {
            await tToken.mint(user, amount, { from: owner });
            await tToken.approve(instance.address, amount, { from: user });
            await instance.stake(tToken.address, amount , { from: user });                
                userBalanceBefore = await tToken.balanceOf(user);
                liquidityBalanceBefore = await tToken.balanceOf(instance.address);
            await helper.advanceBlocks(100);
            }
            if (isPaused) {
                await atmSettingsInstance.givenMethodReturnBool(
                    atmSettingsEncoder.encodeIsATMPaused(),
                    true
                );
            }   
            try {
                // Invocation 
                const result = await instance.unStake(tToken.address, amount + offset , { from: user });
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                // Validating result
                const userBalanceAfter = await tToken.balanceOf(user);
                assert(parseInt(userBalanceAfter) > parseInt(userBalanceBefore), 'user tTokens not received on unStake.');
                const liquidityBalanceAfter = await tToken.balanceOf(instance.address);
                assert(parseInt(liquidityBalanceAfter) < parseInt(liquidityBalanceBefore), 'liquidity tTokens not sent on unStake.');
                assert(parseInt(liquidityBalanceAfter) == parseInt(userBalanceBefore), 'tTokens sent amount is incorrect.');
                const accruedTLRBalance = parseInt(await instance.getTLRTotalBalance.call(tToken.address, {from: user}));
                // Validating events were emitted
                liquidityMining
                    .unstake(result)
                    .emitted(user, tToken.address, amount, result.receipt.blockNumber, 0, accruedTLRBalance);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
   

 
 
    withData({
        _1_one_reward_multi_unstake: [ [10, 20, 30, 5, 3], false, undefined ],
    }, function(amounts, mustFail, expectedErrorMessage) {
        it(t("user", "unStake#2-one-reward-multiple-unStakes", "Should be able or not to unStake tTokens.", mustFail), async function() {
            // Setup
            let totalAmount = 0;
            for (let a = 0; a < amounts.length; a++) {
                await helper.advanceBlocks(10);
                totalAmount += parseInt(amounts[a]);
                await tToken.mint(user, amounts[a], { from: owner });
                await tToken.approve(instance.address, totalAmount, { from: user });
                await instance.stake(tToken.address, amounts[a] , { from: user });                    
            }
            let liquidityBalanceBefore = parseInt(await tToken.balanceOf(instance.address)) ;

            try {
                // Setup
                totalAmount = 0;
                for (let i = 0; i < amounts.length; i++) {
                    totalAmount += parseInt(amounts[i]);
                    await helper.advanceBlocks(10);
                    // Invocation 
                    const result = await instance.unStake(tToken.address, amounts[i] , { from: user });
                    // Assertions
                    assert(!mustFail, 'It should have failed because data is invalid.');
                    // Validating result
                    const userBalanceAfter = parseInt(await tToken.balanceOf(user)) ;
                    assert.equal(userBalanceAfter, totalAmount, "user didn't receive corresponding tTokens");
                    const liquidityBalanceAfter = parseInt(await tToken.balanceOf(instance.address)) ;
                    assert.equal(liquidityBalanceBefore, liquidityBalanceAfter + userBalanceAfter, "tTokens not sent from liquidity to user")
                    // Validating events were emitted
                    const accruedTLRBalance = parseInt(await instance.getTLRTotalBalance.call(tToken.address, {from: user}));
                    liquidityMining
                        .unstake(result)
                        .emitted(user, tToken.address, amounts[i], result.receipt.blockNumber, liquidityBalanceBefore - totalAmount, accruedTLRBalance);
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
        it(t("user", "unStake#3-multiple-rewards-multiple-unStakes", "Should be able or not to stake tTokens.", mustFail), async function() {
            // Setup
            const totalAmounts = amounts.reduce((a, b) => a + b, 0);        
            await tToken.mint(user, totalAmounts, { from: owner });
            await tToken.approve(instance.address, totalAmounts, { from: user });
            await instance.stake(tToken.address, totalAmounts , { from: user });
            const userBalanceBefore = parseInt(await tToken.balanceOf(user)) ;
            await helper.advanceBlocks(100);
            // First unStake call
            await instance.unStake(tToken.address, amounts[0] , { from: user });
            // New rewards added
            for (let r = 0; r < rewards.length; r++){
                await helper.advanceBlocks(rewards[r]);
                await governance.addTLRReward(rewards[r], { from: owner});
            }
            try {
                // Invocation second unStake call
                const result = await instance.unStake(tToken.address, amounts[1] , { from: user });
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                // Validating result
                liquidityBalanceAfter = parseInt(await tToken.balanceOf(instance.address)) ;
                assert.equal(userBalanceBefore, 0, "user tTokens should have been sent to liquidity contract");
                assert.equal(liquidityBalanceAfter, 0, "liquidity tToken balance not correct");
                const userBalanceAfter = parseInt(await tToken.balanceOf(user)) ;
                assert.equal(userBalanceAfter, totalAmounts, "user tToken balance not correct");
                // Validating events were emitted
                const accruedTLRBalance = parseInt(await instance.getTLRTotalBalance.call(tToken.address, {from: user}));
                liquidityMining
                    .unstake(result)
                    .emitted(user, tToken.address, amounts[1], result.receipt.blockNumber, 0, accruedTLRBalance); 
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
    
});
