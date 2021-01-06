// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS  } = require('../utils/consts');
const ATMSettingsEncoder = require('../utils/encoders/ATMSettingsEncoder');
const SettingsEncoder = require('../utils/encoders/SettingsEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TLRToken = artifacts.require("./TLRToken.sol");

contract('TLRTokenMintTest', function (accounts) {
    const atmSettingsEncoder = new ATMSettingsEncoder(web3);
    const settingsEncoder = new SettingsEncoder(web3);
    let atmSettingsInstance;
    let settingsInstance;
    let atmInstance;
    let instance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        atmSettingsInstance = await Mock.new();
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
        _1_basic: [true, daoAgent, daoMember1, 2000, undefined, false],
        _2_above_cap: [true, daoAgent, daoMember1, 11000, 'ERC20_CAP_EXCEEDED', true],
        _3_zero_address: [true, daoAgent, NULL_ADDRESS, 3000, "MINT_TO_ZERO_ADDRESS_NOT_ALLOWED", true],
        _4_invalid_sender: [false, daoMember1, daoMember1, 2000, 'MinterRole: caller does not have the Minter role', true],
    },function(
        senderHasPauserRole,
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
            if(!senderHasPauserRole) {
                await settingsInstance.givenMethodRevertWithMessage(
                    settingsEncoder.encodeRequirePauserRole(),
                    "NOT_PAUSER"
                );
            }

            try {
                // Invocation
                await instance.mint(receipent, amount, { from: sender });
                const result = await instance.totalSupply();

                // Assertions
                assert(!mustFail, 'It should have failed because the data is invalid');
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
