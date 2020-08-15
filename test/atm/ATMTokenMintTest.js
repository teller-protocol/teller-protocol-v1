// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS  } = require('../utils/consts');
const SettingsInterfaceEncoder = require('../utils/encoders/settingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMToken = artifacts.require("./ATMToken.sol");

contract('ATMTokenMintTest', function (accounts) {
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let settingsInstance;
    let instance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[1];

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        instance = await ATMToken.new(
                                    "ATMToken",
                                    "ATMT",
                                    18,
                                    10000,
                                    50,
                                    settingsInstance.address
                            );
    });

    withData({
        _1_mint_no_vesting_basic: [daoMember1, 2000, undefined, false],
        _2_mint_no_vesting_above_cap: [daoMember1, 11000, 'ERC20_CAP_EXCEEDED', true],
        _3_mint_no_vesting_zero_address: [NULL_ADDRESS, 3000, "MINT_TO_ZERO_ADDRESS_NOT_ALLOWED", true]
    },function(
        receipent,
        amount,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'mint', 'Should or should not be able to mint correctly', mustFail), async function() {
            await settingsInstance.givenMethodReturnBool(
                settingsInterfaceEncoder.encodeIsPaused(),
                false
            );

            try {
                // Invocation
                await instance.mint(receipent, amount, { from: daoAgent });
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