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

contract('LendingPoolRepayTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    let instance;
    let zdaiInstance;
    let daiInstance;
    let lendersInstance;
    let loansAddress = accounts[0];
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await Mock.new();
        daiInstance = await Mock.new();
        instance = await LendingPool.new();
        lendersInstance = await Lenders.new(zdaiInstance.address, instance.address);

        await instance.initialize(
            zdaiInstance.address,
            daiInstance.address,
            lendersInstance.address,
            loansAddress,
        );
    });

    withData({
        _1_basic: [accounts[1], loansAddress, true, 10, undefined, false],
        _2_notLoan: [accounts[1], accounts[2], true, 10, 'Address is not Loans contract.', true],
        _3_transferFail: [accounts[1], loansAddress, false, 200, "TransferFrom wasn't successful.", true],
    }, function(borrower, sender, transferFrom, amountToRepay, expectedErrorMessage, mustFail) {
        it(t('user', 'repay', 'Should able (or not) to repay loan.', mustFail), async function() {
            // Setup
            const encodeTransferFrom = erc20InterfaceEncoder.encodeTransferFrom();
            await daiInstance.givenMethodReturnBool(encodeTransferFrom, transferFrom);

            try {
                // Invocation
                const result = await instance.repay(amountToRepay, borrower, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                lendingPool
                    .tokenRepaid(result)
                    .emitted(borrower, amountToRepay);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});