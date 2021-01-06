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
const ATMSettingsEncoder = require('../utils/encoders/ATMSettingsEncoder');
const SettingsEncoder = require('../utils/encoders/SettingsEncoder');

contract("ATMLiquidityMiningCalculateAccruedTLRTest", function(accounts) {
    const atmSettingsEncoder = new ATMSettingsEncoder(web3);
    const settingsEncoder = new SettingsEncoder(web3);
    const owner = accounts[0]; 
    const user = accounts[2];
    const INITIAL_REWARD = 1;
    const MAX_BLOCK_INTERVAL = 10;
    const FLOATING_SHOULD_RESET_AFTER_STAKE_OPERATION = 0;
    let instance;
    let governance;
    let tToken;

    beforeEach("Setup for each test", async () => {
        const settings = await Mock.new();
        const atmSettingsInstance = await Mock.new();
        await atmSettingsInstance.givenMethodReturnBool(
            atmSettingsEncoder.encodeIsATMPaused(),
            false
        );
        await settings.givenMethodReturnAddress(
            settingsEncoder.encodeATMSettings(),
            atmSettingsInstance.address
        );
        governance = await ATMGovernance.new();
        await governance.initialize(settings.address, owner, INITIAL_REWARD);
        const tlr = await TLRToken.new();   
        tToken = await TDAI.new(settings.address);
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
                const result = parseInt(await instance.getTLRFloatingBalance.call(tToken.address, { from: user}));
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
        _1_one_reward_multi_stake: [ [10, 10, 10, 10, 10, 10, 10, 10, 10], [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600], false, undefined ],
    }, function(amounts,expectedResults, mustFail, expectedErrorMessage) {
        it(t("user", "calculateAccruedTLR#2-one-reward-multiple-stakes", "Should be able or not to stake tTokens.", mustFail), async function() {
            try {
                // Setup
                for (let i = 0; i < amounts.length; i++) {
                    const before = parseInt((await helper.latestBlock()).number);
                    await tToken.mint(user, amounts[i], { from: owner });
                    await tToken.approve(instance.address, amounts[i], { from: user });
                    const tx = await instance.stake(tToken.address, amounts[i] , { from: user });
                    // Invocation 
                    const result = parseInt(await instance.getTLRTotalBalance.call(tToken.address, {from: user}));
                    // Assertions
                    assert(!mustFail, 'It should have failed because data is invalid.');
                    // Validating results
                    assert.equal(result, expectedResults[i], "Error validating accrued TLR");
                    // Advance blocks
                    const setupBlocksInterval = parseInt(tx.receipt.blockNumber) - before;
                    const advance = MAX_BLOCK_INTERVAL - setupBlocksInterval;
                    await helper.advanceBlocks(advance);
                }
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
    
 
    withData({
        _1_multi_reward_multi_stake: [ [10, 100], [10, 100, 1000], [100, 10100, 1010100, 1020100], false, undefined ],
    }, function(amounts, rewards, expectedResults, mustFail, expectedErrorMessage) {
        it(t("user", "calculateAccruedTLR#3-multiple-rewards-multiple-stakes", "Should be able or not to stake tTokens.", mustFail), async function() {
            // Setup
            const totalAmounts = amounts.reduce((a, b) => a + b, 0);        
            await tToken.mint(user, totalAmounts, { from: owner });
            await tToken.approve(instance.address, totalAmounts, { from: user });
            // Initial stake
            await instance.stake(tToken.address, amounts[0] , { from: user });
            try {
                // Adding new rewards as owner
                for (let r = 0; r < rewards.length; r++){
                    await helper.advanceBlocks(rewards[r] - 1 );
                    await governance.addTLRReward(rewards[r], { from: owner});
                    const accrued = parseInt(await instance.getTLRTotalBalance.call(tToken.address, {from: user}));
                    const floating = parseInt(await instance.getTLRFloatingBalance.call(tToken.address, {from: user}));
                    // Validating both accrued and floating balances are equal
                    assert.equal(accrued, floating, "Both TLR accrued balances should be equal as no other STAKE(), UNSTAKE(), WITHDRAW() operation has been called.");
                    assert.equal(floating, expectedResults[r], "Incorrect floating TLR calculation.")
                }
                // Invocation - second stake 
                const result = await instance.stake(tToken.address, amounts[1] , { from: user });
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                // Validating result
                const floating = parseInt(await instance.getTLRFloatingBalance.call(tToken.address, {from: user}));
                assert.equal(floating, FLOATING_SHOULD_RESET_AFTER_STAKE_OPERATION, "Floating should be zero after stake().");
                const accruedTLRBalance = parseInt(await instance.getTLRTotalBalance.call(tToken.address, {from: user}));
                assert.equal(accruedTLRBalance, expectedResults[expectedResults.length - 1], "Incorrect accrued TLR calculation.")
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

});
