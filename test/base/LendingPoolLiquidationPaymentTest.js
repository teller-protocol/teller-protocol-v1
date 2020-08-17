// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const CompoundInterfaceEncoder = require('../utils/encoders/CompoundInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('LendingPoolLiquidationPaymentTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const compoundInterfaceEncoder = new CompoundInterfaceEncoder(web3);
    let instance;
    let tTokenInstance;
    let daiInstance;
    let lendersInstance;
    let interestConsensusInstance;
    let cTokenInstance;
    let settingsInstance;
    let marketsInstance;
    let loansInstance = accounts[0];
    
    beforeEach('Setup for each test', async () => {
        tTokenInstance = await Mock.new();
        daiInstance = await Mock.new();
        instance = await LendingPool.new();
        interestConsensusInstance = await Mock.new();
        cTokenInstance = await Mock.new()
        settingsInstance = await Mock.new();
        marketsInstance = await Mock.new();
        lendersInstance = await Lenders.new();

        await lendersInstance.initialize(
          tTokenInstance.address,
          instance.address,
          interestConsensusInstance.address,
          settingsInstance.address,
          marketsInstance.address,
        );
    });

    withData({
        _1_cTokenSupported_basic: [accounts[1], loansInstance, true, true, 10, false, 1000, undefined, false],
        _2_cTokenSupported_transferFromFail: [accounts[1], loansInstance, true, false, 10, false, 1000, "LENDING_TRANSFER_FROM_FAILED", true],
        _3_cTokenSupported_notLoansSender: [accounts[1], accounts[2], true, true, 71, false, 1000, 'ADDRESS_ISNT_LOANS_CONTRACT', true],
        _4_cTokenSupported_compoundFail: [accounts[1], loansInstance, true, true, 10, true, 1000, 'COMPOUND_DEPOSIT_ERROR', true],
        _5_cTokenNotSupported_basic: [accounts[1], loansInstance, false, true, 10, false, 1000, undefined, false],
        _6_cTokenNotSupported_transferFromFail: [accounts[1], loansInstance, false, false, 10, false, 1000, "LENDING_TRANSFER_FROM_FAILED", true],
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
            const cTokenAddress = isCTokenSupported ? cTokenInstance.address : NULL_ADDRESS;
            await instance.initialize(
                tTokenInstance.address,
                daiInstance.address,
                lendersInstance.address,
                loansInstance,
                cTokenAddress,
                settingsInstance.address,
                marketsInstance.address,
                NULL_ADDRESS,
            );
            const encodeTransferFrom = erc20InterfaceEncoder.encodeTransferFrom();
            await daiInstance.givenMethodReturnBool(encodeTransferFrom, transferFrom);

            const redeemResponse = compoundFails ? 1 : 0
            const encodeMint = compoundInterfaceEncoder.encodeMint();
            await cTokenInstance.givenMethodReturnUint(encodeMint, redeemResponse);
            const encodeAllowance = erc20InterfaceEncoder.encodeAllowance();
            await daiInstance.givenMethodReturnUint(encodeAllowance, allowance);

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
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});