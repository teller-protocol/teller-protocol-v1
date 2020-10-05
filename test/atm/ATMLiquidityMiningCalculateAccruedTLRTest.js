// JS Libraries
const helper = require("../utils/time-block-helper");
const withData = require("leche").withData;
const { t } = require("../utils/consts");
const { assert } = require("chai");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TLRToken = artifacts.require("./atm/TLRToken.sol");
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
const ATMLiquidityMining = artifacts.require("./atm/ATMLiquidityMining.sol");
const TDAI = artifacts.require("./base/TDAI.sol");

contract("ATMLiquidityMiningCalculateAccruedTLRTest", function(accounts) {
    const owner = accounts[0]; 
    const user = accounts[2];
    const INITIAL_REWARD = 1;
    const MAX_BLOCK_INTERVAL = 10;
    let instance;
    let governance;
    let tToken;

    beforeEach("Setup for each test", async () => {
        const settings = await Mock.new();
        governance = await ATMGovernance.new();
        await governance.initialize(settings.address, owner, INITIAL_REWARD);
        const tlr = await TLRToken.new();   
        tToken = await TDAI.new();
        instance = await ATMLiquidityMining.new();
        await instance.initialize(settings.address, governance.address, tlr.address, { from: owner });
    });
    withData({
        _1_no_stake_only_initial_reward: [ [], 0, false, undefined ],
        _2_no_stake_: [ [3, 6, 12], 0, false, undefined ],
        _3_no_stake_nothing_accrued: [ [2, 400, 1000, 2000], 0, false, undefined ],
    }, function(tlrRewards, expectedResult, mustFail, expectedErrorMessage) {
        it(t("user", "calculateAccruedTLR", "Should be able or not to calculate accrued TLR tokens.", mustFail), async function() {
            // Setup
            // Configuring rewards
            for (let i = 0; i < tlrRewards.length; i++) {
                await governance.addTLRReward(tlrRewards[i], { from: owner });
                // advance 10 blocks (in addition to what is already mined by ganache)
                await helper.advanceBlocks(10);
            }
            try {
                // Invocation 
                const result = parseInt(await instance.getTLRFloatingBalance.call({ from: user}));
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                // Validating result
                assert.equal(result, expectedResult, 'Incorrect result');

            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
    withData({
        _1_one_reward_multi_stake: [ [10, 10, 10, 10, 10, 10, 10, 10, 10], [0, 90, 280, 570, 960, 1450, 2040, 2730, 3520], false, undefined ],
    }, function(amounts,expectedResults, mustFail, expectedErrorMessage) {
        it(t("user", "calculateAccruedTLR#2-one-reward-multiple-stakes", "Should be able or not to stake tTokens.", mustFail), async function() {
            try {
                // Setup
                for (let i = 0; i < amounts.length; i++) {
                    const before = parseInt((await helper.latestBlock()).number);
                    await tToken.mint(user, amounts[i], { from: owner });
                    await tToken.approve(instance.address, amounts[i], { from: user });
                    // Invocation 
                    const result = parseInt(await instance.getTLRTotalBalance.call({from: user}));
                    // Assertions
                    assert(!mustFail, 'It should have failed because data is invalid.');
                    // Validating results
                    assert.equal(result, expectedResults[i], "Error validating accrued TLR");
                    const tx = await instance.stake(tToken.address, amounts[i] , { from: user });
                    const interval = parseInt(tx.receipt.blockNumber) - before;
                    const advance = MAX_BLOCK_INTERVAL - interval;
                    await helper.advanceBlocks(advance);
                }
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
        _1_multi_reward_multi_stake: [ [10, 100], [20, 200, 2000], false, undefined ],
    }, function(amounts, rewards, mustFail, expectedErrorMessage) {
        it(t("user", "calculateAccruedTLR#3-multiple-rewards-multiple-stakes", "Should be able or not to stake tTokens.", mustFail), async function() {
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
    */

});
