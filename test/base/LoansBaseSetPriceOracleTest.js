// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const { loans } = require('../utils/events');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");

contract('LoansBaseSetPriceOracleTest', function (accounts) {
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let instance;
    let settingsInstance;
    let oracleInstance;

    beforeEach('Setup for each test', async () => {
        const lendingPoolInstance = await Mock.new();
        const loanTermsConsInstance = await Mock.new();
        const marketsInstance = await Mock.new();
        const atmSettingsInstance = await Mock.new();
        oracleInstance = await Mock.new();
        settingsInstance = await Mock.new()
        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            marketsInstance.address,
            atmSettingsInstance.address,
        )
    });

    const getNewPriceOracle = async (newPriceOracleIndex, Mock) => {
        if (newPriceOracleIndex === -1) {
            return NULL_ADDRESS;
        }
        if (newPriceOracleIndex === 0) {
            return oracleInstance.address;
        }
        if (newPriceOracleIndex === 99) {
            return (await Mock.new()).address;
        }
        return accounts[newPriceOracleIndex];
    };

    withData({
        _1_basic: [1, true, 99, undefined, false],
        _2_sender_not_allowed: [1, false, 99, 'ADDRESS_ISNT_ALLOWED', true],
        _3_new_price_oracle_empty: [1, true, -1, 'ORACLE_MUST_CONTRACT_NOT_EMPTY', true],
        _4_new_price_oracle_not_contract: [1, true, 2, 'ORACLE_MUST_CONTRACT_NOT_EMPTY', true],
        _5_must_provide_new_price_oracle: [1, true, 0, 'NEW_ORACLE_MUST_BE_PROVIDED', true],
    }, function(senderIndex, hasPauserRole, newPriceOracleIndex, expectedErrorMessage, mustFail) {
        it(t('user', 'setPriceOracle', 'Should be able (or not) to set a new price oracle instance.', mustFail), async function() {
            // Setup
            const sender = senderIndex === -1 ? NULL_ADDRESS : accounts[senderIndex];
            /*
                If index = -1 => empty address (0x0)
                If index = 99 => a new contract address
                If index = 0 => current oracle address.
                Otherwise accounts[index]
            */
            const newPriceOracle = await getNewPriceOracle(newPriceOracleIndex, Mock);

            await settingsInstance.givenMethodReturnBool(
                settingsInterfaceEncoder.encodeHasPauserRole(),
                hasPauserRole
            );

            try {
                // Invocation
                const result = await instance.setPriceOracle(
                    newPriceOracle,
                    {
                        from: sender,
                    }
                );

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                loans
                    .priceOracleUpdated(result)
                    .emitted(sender, oracleInstance.address, newPriceOracle);
                
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        })
    })
})