// JS Libraries
const withData = require('leche').withData;
const { t  } = require('../utils/consts');
const Timer = require('../../scripts/utils/Timer');
const { tlrToken } = require('../utils/events');
const ATMSettingsEncoder = require('../utils/encoders/ATMSettingsEncoder');
const SettingsEncoder = require('../utils/encoders/SettingsEncoder');
const BN = require("bignumber.js");

 // Mock contracts
 const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TLRToken = artifacts.require("./TLRToken.sol");

contract('TLRTokenWithdrawVestedTest', function (accounts) {
    const atmSettingsEncoder = new ATMSettingsEncoder(web3);
    const settingsEncoder = new SettingsEncoder(web3);
    let settingsInstance;
    let atmSettingsInstance;
    let atmInstance;
    let instance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];
    const daoMember2 = accounts[3];
    const timer = new Timer(web3);

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        atmSettingsInstance = await Mock.new();
        await atmSettingsInstance.givenMethodReturnAddress(
            atmSettingsEncoder.encodeSettings(),
            settingsInstance.address
        );
        atmInstance = await Mock.new();
        instance = await TLRToken.new();
        await instance.initialize(
                            "Teller Token",
                            "TLR",
                            18,
                            10000,
                            50,
                            settingsInstance.address,
                            atmInstance.address
                        );
        await settingsInstance.givenMethodReturnAddress(
            settingsEncoder.encodeATMSettings(),
            atmSettingsInstance.address
        );
    });

    withData({
        _1_claim_vested_basic: [daoMember2, 1000, 2500, 7000, 8000, undefined, false],
        _2_claim_vested_before_deadline_after_cliff: [daoMember2, 1000, 3000, 7000, 5000, undefined, false],
        _3_claim_vested_no_amount: [daoMember1, 1000, 4000, 7000, 8000, 'ACCOUNT_DOESNT_HAVE_VESTING', true]
    },function(
        receipent,
        amount,
        cliff,
        vestingPeriod,
        claimTime,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'withdrawVested', 'Should or should not be able to claim correctly', mustFail), async function() {

        // Setup 
        await instance.mintVesting(daoMember2, amount, cliff, vestingPeriod, { from: daoAgent });
        await atmSettingsInstance.givenMethodReturnBool(
            atmSettingsEncoder.encodeIsATMPaused(),
            false
        );
            
            try {
                // Invocation
                const currentTime = await timer.getCurrentTimestampInSeconds();
                await timer.advanceBlockAtTime(currentTime + claimTime);
                const result = await instance.withdrawVested({ from: receipent });
                // Assertions
                assert(!mustFail, 'It should have failed because the account is not vested');
                assert(result);
                tlrToken
                    .vestingClaimed(result)
                    .emitted(receipent, amount);
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
