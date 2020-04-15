// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('LendingPoolLiquidationPaymentTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    let instance;
    let zdaiInstance;
    let daiInstance;
    let lendersInstance;
    let loansInstance = accounts[0];
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await Mock.new();
        daiInstance = await Mock.new();
        instance = await LendingPool.new();
        lendersInstance = await Lenders.new(zdaiInstance.address, instance.address);

        await instance.initialize(
            zdaiInstance.address,
            daiInstance.address,
            lendersInstance.address,
            loansInstance,
        );
    });

    withData({
        _1_basic: [accounts[1], loansInstance, true, 10, undefined, false],
        _2_transferFail: [accounts[1], loansInstance, false, 10, 'Transfer was not successful.', true],
        _3_notLoansSender: [accounts[1], accounts[2], true, 71, 'Address is not Loans contract.', true],
    }, function(liquidator, sender, transfer, amountToLiquidate, expectedErrorMessage, mustFail) {
        it(t('user', 'liquidationPayment', 'Should able (or not) to liquidate payment.', mustFail), async function() {
            // Setup
            const encodeTransfer = erc20InterfaceEncoder.encodeTransfer();
            await daiInstance.givenMethodReturnBool(encodeTransfer, transfer);

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