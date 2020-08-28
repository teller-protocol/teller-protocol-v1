// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require('leche').withData;
const { t, NULL_ADDRESS  } = require('../utils/consts');
const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMToken = artifacts.require("./ATMToken.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('ATMTokenMintTest', function (accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    let atmSettingsInstance;
    let atmInstance;
    let instance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];

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
                            50,
                            atmSettingsInstance.address,
                            atmInstance.address
                        );
    });

    withData({
        _1_basic: [daoAgent, daoMember1, 2000, undefined, false],
        _2_above_cap: [daoAgent, daoMember1, 11000, 'ERC20_CAP_EXCEEDED', true],
        _3_zero_address: [daoAgent, NULL_ADDRESS, 3000, "MINT_TO_ZERO_ADDRESS_NOT_ALLOWED", true],
        _4_invalid_sender: [daoMember1, daoMember1, 2000, 'ONLY_PAUSER', true],
    },function(
        sender,
        receipent,
        amount,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'mint', 'Should or should not be able to mint correctly', mustFail), async function() {
            await atmSettingsInstance.givenMethodReturnBool(
                atmSettingsEncoder.encodeIsATMPaused(),
                false
            );

            try {
                // Invocation
                await instance.mint(receipent, amount, { from: sender });
                const result = await instance.totalSupply();
                // Assertions
                assert(!mustFail, 'It should have failed because the amount is greater than the cap');
                assert(result);
                assert.equal(
                    result.toString(),
                    amount.toString(),
                    "Minting was not successful!"
                );
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