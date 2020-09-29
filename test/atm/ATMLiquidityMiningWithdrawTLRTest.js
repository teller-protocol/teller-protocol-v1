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
const ATMLiquidityMining = artifacts.require("./atm/ATMLiquidityMining.sol");

contract("ATMLiquidityMiningWithdrawTLRTest", function(accounts) {
    const owner = accounts[0]; 
    const user = accounts[2];
    const INITIAL_REWARD = 1;
    let instance;
    let governance;
    let tlr;

    const SETTING_NAME = toBytes32(web3, 'MIN_TLR_TO_REDEEM');
    const SETTING_VALUE = 3000;
    
    
    beforeEach("Setup for each test", async () => {
        const settingsInstance = await createTestSettingsInstance(Settings, { from: owner, Mock });
        governance = await ATMGovernance.new();
        await governance.initialize(settingsInstance.address, owner, INITIAL_REWARD);
        await governance.addGeneralSetting(SETTING_NAME, SETTING_VALUE, { from: owner });
        tlr = await TLRToken.new();
        tToken = await TDAI.new();
        instance = await ATMLiquidityMining.new(); 
        await tlr.initialize("name", "TLR", 10, 100000, 100, settingsInstance.address, governance.address);
        await tlr.addMinter(instance.address, { from: owner });
        await instance.initialize(settingsInstance.address, governance.address, tlr.address, { from: owner });
    });

    withData({
        _1_basic: [ true, 10, SETTING_VALUE + 2, 1000, false, undefined ],
        _2_not_enough_to_redeem: [ true, 10, 1, 1, true, "NOT_ENOUGH_TLR_TOKENS_TO_REDEEM" ],
        _3_not_enough_amount: [ true, 10, 500000000, 1000, true, "UNSUFFICIENT_TLR_TO_WITHDRAW" ],
        _4_not_user: [ false, 10, 500000000, 1000, true, "UNSUFFICIENT_TLR_TO_WITHDRAW" ],
    }, function(correctUser, stakeAmount, withdrawAmount, newBlocks, mustFail, expectedErrorMessage) {
        it(t("user", "withdrawTLR", "Should be able or not to withdraw TLR tokens.", mustFail), async function() {
            // Setup
            await tToken.mint(user, stakeAmount, { from: owner });
            await tToken.approve(instance.address, stakeAmount, { from: user });
            await instance.stake(tToken.address, stakeAmount , { from: user });
            await helper.advanceBlocks(newBlocks);
            try {
                // Invocation 
                const userTLRBalanceBefore = await tlr.balanceOf(user);
                let aUser;
                correctUser ? aUser = user : accounts[10];
                const result = await instance.withdrawTLR(withdrawAmount, { from: aUser });
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                // Validating result
                const userTLRBalanceAfter = await tlr.balanceOf(user);
                assert(parseInt(userTLRBalanceAfter) > parseInt(userTLRBalanceBefore), 'user TLR not minted.');
                assert.equal(userTLRBalanceAfter, withdrawAmount, 'TLR balance is not correct.');
                // Validating events were emitted
                liquidityMining
                    .withdrawTLR(result)
                    .emitted(user, withdrawAmount, result.receipt.blockNumber, stakeAmount);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

});
