// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
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
    let loansInstance = accounts[0];
    
    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        daiInstance = await Mock.new();
        instance = await LendingPool.new();
        interestConsensusInstance = await Mock.new();
        cTokenInstance = await Mock.new()
        const settingsInstance = await Mock.new();

        lendersInstance = await Lenders.new(
          zTokenInstance.address,
          instance.address,
          interestConsensusInstance.address
        );

        await instance.initialize(
            zTokenInstance.address,
            daiInstance.address,
            lendersInstance.address,
            loansInstance,
            cTokenInstance.address,
            settingsInstance.address,
        );
    });

    withData({
        _1_basic: [accounts[1], loansInstance, true, 10, false, undefined, false],
        _2_transferFromFail: [accounts[1], loansInstance, false, 10, false, "TransferFrom wasn't successful.", true],
        _3_notLoansSender: [accounts[1], accounts[2], true, 71, false, 'Address is not Loans contract.', true],
        _4_compoundFail: [accounts[1], loansInstance, true, 10, true, 'COMPOUND_DEPOSIT_ERROR', true]
    }, function(
        liquidator,
        sender,
        transferFrom,
        amountToLiquidate,
        compoundFails,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'liquidationPayment', 'Should able (or not) to liquidate payment.', mustFail), async function() {
            // Setup
            const encodeTransferFrom = erc20InterfaceEncoder.encodeTransferFrom();
            await daiInstance.givenMethodReturnBool(encodeTransferFrom, transferFrom);

            const redeemResponse = compoundFails ? 1 : 0
            const encodeMint = compoundInterfaceEncoder.encodeMint();
            await cTokenInstance.givenMethodReturnUint(encodeMint, redeemResponse)

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