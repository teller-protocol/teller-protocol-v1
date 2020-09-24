// JS Libraries
const helper = require("../utils/time-block-helper");
const withData = require("leche").withData;
const { t } = require("../utils/consts");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TLRToken = artifacts.require("./atm/TLRToken.sol");
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
const ATMLiquidityMiningMock = artifacts.require("./atm/ATMLiquidityMiningMock.sol");

contract("ATMLiquidityMiningCalculateAccruedTLRTest", function(accounts) {
    const OWNER_INDEX = 1;
    const owner = accounts[OWNER_INDEX]; 
    const INITIAL_REWARD = 1;
    let instance;
    let governance;

    beforeEach("Setup for each test", async () => {
        const settingsInstance = await Mock.new();
        governance = await ATMGovernance.new();
        await governance.initialize(settingsInstance.address, owner, INITIAL_REWARD);
        const tlr = await TLRToken.new();   
        await instance.initialize(
            "Teller Token",
            "TLR",
            18,
            10000,
            50,
            settingsInstance.address,
            governance.address
        );   
        instance = await ATMLiquidityMiningMock.new();
        await instance.initialize(governance.address, tlr.address, { from: accounts[OWNER_INDEX] });
    });

    withData({
        _1_no_stake_only_initial_reward: [ [], 0, false, undefined ],
        _2_no_stake_: [ [3, 6, 12], 0, false, undefined ],
        _3_no_stake_nothing_accrued: [ [1, 400, 1000, 2000], 0, false, undefined ],
    }, function(tlrRewards, expectedResult, mustFail, expectedErrorMessage) {
        it(t("user", "calculateAccruesTLR", "Should be able or not to calculate accrued TLR tokens.", mustFail), async function() {
            // Setup
            // Configuring rewards
            for (let i = 0; i < tlrRewards.length; i++) {
                await governance.addTLRReward(tlrRewards[i], { from: accounts[OWNER_INDEX] });
                // advance 10 blocks (in addition to what is already mined by ganache)
                await helper.advanceBlocks(10);
            }
            const latestBlock = await helper.latestBlock();
            try {
                // Invocation 
                const result = await instance.callCalculateAccruedTLR.call(latestBlock.number);
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                // Validating result
                assert(parseInt(result) == expectedResult, 'Incorrect result');

            } catch (error) {
                console.log(error);
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
