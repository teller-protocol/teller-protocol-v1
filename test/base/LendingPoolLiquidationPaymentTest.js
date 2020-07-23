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
    let zTokenInstance;
    let daiInstance;
    let lendersInstance;
    let interestConsensusInstance;
    let cTokenInstance;
    let settingsInstance;
    let loansInstance = accounts[0];

    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        daiInstance = await Mock.new();
        instance = await LendingPool.new();
        interestConsensusInstance = await Mock.new();
        cTokenInstance = await Mock.new()
        settingsInstance = await Mock.new();

        lendersInstance = await Lenders.new(
          zTokenInstance.address,
          instance.address,
          interestConsensusInstance.address
        );
    });

    withData({
        _1_cTokenSupported_basic: [accounts[1], loansInstance, true, true, 10, false, undefined, false],
        _2_cTokenSupported_transferFromFail: [accounts[1], loansInstance, true, false, 10, false, "TransferFrom wasn't successful.", true],
        _3_cTokenSupported_notLoansSender: [accounts[1], accounts[2], true, true, 71, false, 'Address is not Loans contract.', true],
        _4_cTokenSupported_compoundFail: [accounts[1], loansInstance, true, true, 10, true, 'COMPOUND_DEPOSIT_ERROR', true],
        _5_cTokenNotSupported_basic: [accounts[1], loansInstance, false, true, 10, false, undefined, false],
        _6_cTokenNotSupported_transferFromFail: [accounts[1], loansInstance, false, false, 10, false, "TransferFrom wasn't successful.", true],
        _7_cTokenNotSupported_notLoansSender: [accounts[1], accounts[2], false, true, 71, false, 'Address is not Loans contract.', true],
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
                zTokenInstance.address,
                daiInstance.address,
                lendersInstance.address,
                loansInstance,
                cTokenAddress,
                settingsInstance.address,
            );
            const encodeTransferFrom = erc20InterfaceEncoder.encodeTransferFrom();
            await daiInstance.givenMethodReturnBool(encodeTransferFrom, transferFrom);

            const redeemResponse = compoundFails ? 1 : 0
            const encodeMint = compoundInterfaceEncoder.encodeMint();
            await cTokenInstance.givenMethodReturnUint(encodeMint, redeemResponse)

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
