// JS Libraries
const withData = require('leche').withData;
const { t  } = require('../utils/consts');
const Timer = require('../../scripts/utils/Timer');
const { atmToken } = require('../utils/events');
const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

 // Mock contracts
 const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMToken = artifacts.require("./ATMToken.sol");

contract('ATMTokenWithdrawVestedTest', function (accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
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
        instance = await ATMToken.new();
        await instance.initialize(
                            "ATMToken",
                            "ATMT",
                            18,
                            10000,
                            50,
                            settingsInstance.address,
                            atmInstance.address
                        );
        await settingsInstance.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeATMSettings(),
            atmSettingsInstance.address
        );
    });

    withData({
        _1_claim_vested_basic: [daoMember2, 1000, 2500, 7000, 7001, undefined, false],
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
                atmToken
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