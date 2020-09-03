// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS  } = require('../utils/consts');
const { atmToken } = require('../utils/events');
const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMToken = artifacts.require("./ATMToken.sol");

contract('ATMTokenMintVestingTest', function (accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let settingsInstance;
    let atmSettingsInstance;
    let atmInstance;
    let instance;
    const daoAgent = accounts[0];
    const daoMember2 = accounts[3];

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        atmSettingsInstance = await Mock.new();
        atmInstance = await Mock.new();
        instance = await ATMToken.new();
        await instance.initialize(
                                "ATMToken",
                                "ATMT",
                                18,
                                10000,
                                1,
                                settingsInstance.address,
                                atmInstance.address
                            );
        await settingsInstance.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeATMSettings(),
            atmSettingsInstance.address
        );
    });

    withData({
        _1_mint_vesting_basic: [true, daoAgent, daoMember2, 1000, 3000, 7000, false, undefined, false],
        _2_mint_vesting_above_cap: [true, daoAgent, daoMember2, 21000, 2000, 7000, false,  'ERC20_CAP_EXCEEDED', true],
        _3_mint_vesting_zero_address: [true, daoAgent, NULL_ADDRESS, 3000, 10000, 60000, false, "MINT_TO_ZERO_ADDRESS_NOT_ALLOWED", true],
        _4_mint_vesting_above_allowed_max_vesting: [true, daoAgent, daoMember2, 1000, 3000, 6000, true, "MAX_VESTINGS_REACHED", true],
        _5_mint_vesting_invalid_sender: [false, daoMember2, daoMember2, 1000, 3000, 7000, false, 'NOT_PAUSER', true],
    },function(
        senderHasPauserRole,
        sender,
        receipent,
        amount,
        cliff,
        vestingPeriod,
        multipleVesting,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'mintVesting', 'Should or should not be able to mint correctly', mustFail), async function() {
            await atmSettingsInstance.givenMethodReturnBool(
                atmSettingsEncoder.encodeIsATMPaused(),
                false
            );
            if(!senderHasPauserRole) {
                await settingsInstance.givenMethodRevertWithMessage(
                    settingsInterfaceEncoder.encodeRequirePauserRole(),
                    "NOT_PAUSER"
                );
            }
        
            try {
                // Invocation
                let result = await instance.mintVesting(receipent, amount, cliff, vestingPeriod, { from: sender });
                if (multipleVesting) {
                    result = await instance.mintVesting(receipent, amount, cliff, vestingPeriod, { from: sender });
                }
                atmToken
                    .newVesting(result)
                    .emitted(receipent, amount, vestingPeriod);
                // Assertions
                assert(!mustFail, 'It should have failed because the amount is greater than the cap');
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