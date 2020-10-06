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

contract("ATMLiquidityMiningStakeTest", function(accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    const owner = accounts[0]; 
    const user = accounts[2];
    const INITIAL_REWARD = 1;
    let instance;
    let governance;
    let tToken;
    let atmSettingsInstance;

    beforeEach("Setup for each test", async () => {
        const settingsInstance = await Mock.new();
        governance = await ATMGovernance.new();
        atmSettingsInstance = await Mock.new();
        await atmSettingsInstance.givenMethodReturnBool(
            atmSettingsEncoder.encodeIsATMPaused(),
            false
        );
        await settingsInstance.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeATMSettings(),
            atmSettingsInstance.address
        );
        await governance.initialize(settingsInstance.address, owner, INITIAL_REWARD);
        const tlr = await TLRToken.new();
        tToken = await TDAI.new();

        instance = await ATMLiquidityMining.new();
        await instance.initialize(settingsInstance.address, governance.address, tlr.address, { from: owner });
    });

    withData({
        _1_basic: [ 10, 0, false, undefined ],
        _2_not_enough_tTokens: [ 10, 1, true, "INSUFFICIENT_TTOKENS_TO_STAKE" ],
    }, function(stakeAmount, offset, mustFail, expectedErrorMessage) {
        it(t("user", "stake#1-one-reward-one-stake", "Should be able or not to stake tTokens.", mustFail), async function() {
            // Setup
            await tToken.mint(user, stakeAmount, { from: owner });
            const userBalanceBefore = await tToken.balanceOf(user);
            const liquidityBalanceBefore = await tToken.balanceOf(instance.address);
            await tToken.approve(instance.address, stakeAmount, { from: user });

            try {
                // Invocation 
                const result = await instance.stake(tToken.address, stakeAmount + offset , { from: user });
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                // Validating result
                const userBalanceAfter = await tToken.balanceOf(user);
                assert(parseInt(userBalanceAfter) < parseInt(userBalanceBefore), 'user tTokens not sent on stake.');
                const liquidityBalanceAfter = await tToken.balanceOf(instance.address);
                assert(parseInt(liquidityBalanceAfter) > parseInt(liquidityBalanceBefore), 'tTokens not received on stake.');
                assert(parseInt(liquidityBalanceAfter) == parseInt(userBalanceBefore), 'tTokens received are less than sent amount.');
                // Validating events were emitted
                liquidityMining
                    .stake(result)
                    .emitted(user, tToken.address, stakeAmount, result.receipt.blockNumber, stakeAmount, 0);
            } catch (error) {
    console.log(error);
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
   
    withData({
        _1_one_reward_multi_stake: [ [10, 20, 30, 5, 3], false, undefined ],
    }, function(amounts, mustFail, expectedErrorMessage) {
        it(t("user", "stake#2-one-reward-multiple-stakes", "Should be able or not to stake tTokens.", mustFail), async function() {
            try {
                // Setup
                let totalAmount = 0;
                for (let i = 0; i < amounts.length; i++) {
                    totalAmount += parseInt(amounts[i]);
                    await tToken.mint(user, amounts[i], { from: owner });
                    await tToken.approve(instance.address, totalAmount, { from: user });
                    // Invocation 
                    const result = await instance.stake(tToken.address, amounts[i] , { from: user });
                    // Assertions
                    assert(!mustFail, 'It should have failed because data is invalid.');
                    // Validating events were emitted
                    const accruedTLRBalance = parseInt(await instance.getTLRTotalBalance.call({from: user}));
                    liquidityMining
                        .stake(result)
                        .emitted(user, tToken.address, amounts[i], result.receipt.blockNumber, totalAmount, accruedTLRBalance); 
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
            // Initial stake
            await tToken.mint(user, amounts[0], { from: owner });
            await tToken.approve(instance.address, amounts[0], { from: user });
            await instance.stake(tToken.address, amounts[0] , { from: user });
            const totalAmounts = amounts.reduce((a, b) => a + b, 0);        
            // Adding new rewards
            for (let r = 0; r < rewards.length; r++){
                await helper.advanceBlocks(rewards[r]);
                await governance.addTLRReward(rewards[r], { from: owner});
            }
            await tToken.mint(user, amounts[1], { from: owner });
            await tToken.approve(instance.address, totalAmounts, { from: user });
            
            try {
                // Invocation 
                const result = await instance.stake(tToken.address, amounts[1] , { from: user });
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                // Validating result
                const liquidityBalanceAfter = parseInt(await tToken.balanceOf(instance.address)) ;
                assert.equal(liquidityBalanceAfter, totalAmounts, "Liquidity contract tToken balance error");
                const accruedTLRBalance = parseInt(await instance.getTLRTotalBalance.call({from: user}));
                // Validating events were emitted
                liquidityMining
                    .stake(result)
                    .emitted(user, tToken.address, amounts[1], result.receipt.blockNumber, totalAmounts, accruedTLRBalance);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
    

});
