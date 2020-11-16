// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const CompoundInterfaceEncoder = require('../utils/encoders/CompoundInterfaceEncoder');
const CTokenInterfaceEncoder = require('../utils/encoders/CTokenInterfaceEncoder')
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DAIMock = artifacts.require("./mock/token/DAIMock.sol")

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('LendingPoolLiquidationPaymentTest', function (accounts) {
    const compoundInterfaceEncoder = new CompoundInterfaceEncoder(web3);
    const cTokenEncoder = new CTokenInterfaceEncoder(web3)
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let instance;
    let tTokenInstance;
    let daiInstance;
    let lendersInstance;
    let interestConsensusInstance;
    let cTokenInstance;
    let settingsInstance;
    let loansInstance = accounts[0];
    
    beforeEach('Setup for each test', async () => {
        tTokenInstance = await Mock.new();
        daiInstance = await DAIMock.new();
        instance = await LendingPool.new();
        interestConsensusInstance = await Mock.new();
        cTokenInstance = await Mock.new()
        settingsInstance = await Mock.new();
        lendersInstance = await Lenders.new();

        await cTokenInstance.givenMethodReturnAddress(
          cTokenEncoder.encodeUnderlying(),
          daiInstance.address
        )

        await lendersInstance.initialize(
          tTokenInstance.address,
          instance.address,
          interestConsensusInstance.address,
          settingsInstance.address,
        );
    });

    withData({
        _1_cTokenSupported_basic: [accounts[1], loansInstance, true, true, 10, false, 1000, undefined, false],
        _2_cTokenSupported_transferFromFail: [accounts[1], loansInstance, true, false, 10, false, 1000, "SafeERC20: ERC20 operation did not succeed", true],
        _3_cTokenSupported_notLoansSender: [accounts[1], accounts[2], true, true, 71, false, 1000, 'ADDRESS_ISNT_LOANS_CONTRACT', true],
        _4_cTokenSupported_compoundFail: [accounts[1], loansInstance, true, true, 10, true, 1000, 'COMPOUND_DEPOSIT_ERROR', true],
        _5_cTokenNotSupported_basic: [accounts[1], loansInstance, false, true, 10, false, 1000, undefined, false],
        _6_cTokenNotSupported_transferFromFail: [accounts[1], loansInstance, false, false, 10, false, 1000, "SafeERC20: ERC20 operation did not succeed", true],
        _7_cTokenNotSupported_notLoansSender: [accounts[1], accounts[2], false, true, 71, false, 1000, 'ADDRESS_ISNT_LOANS_CONTRACT', true],
    }, function(
        liquidator,
        sender,
        isCTokenSupported,
        transferFrom,
        amountToLiquidate,
        compoundFails,
        allowance,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'liquidationPayment', 'Should able (or not) to liquidate payment.', mustFail), async function() {
            // Setup
            if(isCTokenSupported) {
                await settingsInstance.givenMethodReturnAddress(
                    settingsInterfaceEncoder.encodeGetCTokenAddress(),
                    cTokenInstance.address
                );
            }
            await instance.initialize(
                tTokenInstance.address,
                daiInstance.address,
                lendersInstance.address,
                loansInstance,
                settingsInstance.address,
            );
            if (!transferFrom) {
                await daiInstance.mockTransferFromReturnFalse();
            }

            const redeemResponse = compoundFails ? 1 : 0
            const encodeMint = compoundInterfaceEncoder.encodeMint();
            await cTokenInstance.givenMethodReturnUint(encodeMint, redeemResponse);
            await daiInstance.mint(liquidator, allowance);
            await daiInstance.approve(instance.address, allowance, { from: liquidator });
            try {
                // Invocation
                const result = await instance.liquidationPayment(amountToLiquidate, liquidator, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                lendingPool
                    .paymentLiquidated(result)
                    .emitted(liquidator, amountToLiquidate);
            } catch (error) {
                // Assertions
                assert(mustFail, error.message);
                assert.equal(error.reason, expectedErrorMessage, error.message);
            }
        });
    });
});