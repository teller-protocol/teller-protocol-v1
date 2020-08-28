// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require('leche').withData;
const { t, NULL_ADDRESS  } = require('../utils/consts');
const { atmToken } = require('../utils/events');
const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMToken = artifacts.require("./ATMToken.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('ATMTokenMintVestingTest', function (accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    let atmSettingsInstance;
    let atmInstance;
    let instance;
    const daoAgent = accounts[0];
    const daoMember2 = accounts[3];

    beforeEach('Setup for each test', async () => {
        const settings = await createTestSettingsInstance(Settings);
        atmSettingsInstance = await Mock.new();
        await atmSettingsInstance.givenMethodReturnAddress(
            atmSettingsEncoder.encodeSettings(),
            settings.address
        );
        atmInstance = await Mock.new();
        instance = await ATMToken.new();
        await instance.initialize(
                                "ATMToken",
                                "ATMT",
                                18,
                                10000,
                                1,
                                atmSettingsInstance.address,
                                atmInstance.address
                            );
    });

    withData({
        _1_mint_vesting_basic: [daoAgent, daoMember2, 1000, 3000, 7000, false, undefined, false],
        _2_mint_vesting_above_cap: [daoAgent, daoMember2, 21000, 2000, 7000, false,  'ERC20_CAP_EXCEEDED', true],
        _3_mint_vesting_zero_address: [daoAgent, NULL_ADDRESS, 3000, 10000, 60000, false, "MINT_TO_ZERO_ADDRESS_NOT_ALLOWED", true],
        _4_mint_vesting_above_allowed_max_vesting: [daoAgent, daoMember2, 1000, 3000, 6000, true, "MAX_VESTINGS_REACHED", true],
        _5_mint_vesting_invalid_sender: [daoMember2, daoMember2, 1000, 3000, 7000, false, 'ONLY_PAUSER', true],
    },function(
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