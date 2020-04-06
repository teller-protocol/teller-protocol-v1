// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { daiPool } = require('../utils/events');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LenderInfo = artifacts.require("./base/LenderInfo.sol");
const DAIPool = artifacts.require("./base/DAIPool.sol");

contract('DAIPoolLiquidatePaymentTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    let instance;
    let zdaiInstance;
    let daiInstance;
    let lenderInfoInstance;
    let loansInstance = accounts[0];
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await Mock.new();
        daiInstance = await Mock.new();
        instance = await DAIPool.new();
        lenderInfoInstance = await LenderInfo.new(zdaiInstance.address, instance.address);

        await instance.initialize(
            zdaiInstance.address,
            daiInstance.address,
            lenderInfoInstance.address,
            loansInstance,
        );
    });

    withData({
        _1_basic: [accounts[1], loansInstance, true, 100, 10, undefined, false],
        _2_transferFail: [accounts[1], loansInstance, false, 100, 10, 'Transfer was not successful.', true],
        _3_notEnoughDaiBalance: [accounts[1], loansInstance, true, 70, 71, 'Not enough DAI balance.', true],
        _4_notLoansSender: [accounts[1], accounts[2], true, 100, 71, 'Address is not Loans contract.', true],
    }, function(liquidator, sender, transfer, daiPoolBalance, amountToLiquidate, expectedErrorMessage, mustFail) {
        it(t('user', 'liquidationPayment', 'Should able (or not) to liquidate payment.', mustFail), async function() {
            // Setup
            const encodeTransfer = erc20InterfaceEncoder.encodeTransfer();
            await daiInstance.givenMethodReturnBool(encodeTransfer, transfer);
            const encodeBalanceOf = erc20InterfaceEncoder.encodeBalanceOf();
            await daiInstance.givenMethodReturnUint(encodeBalanceOf, daiPoolBalance);

            try {
                // Invocation
                const result = await instance.liquidationPayment(amountToLiquidate, liquidator, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                daiPool
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