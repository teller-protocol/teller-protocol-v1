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

contract('DAIPoolRepayDaiTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    let instance;
    let zdaiInstance;
    let daiInstance;
    let lenderInfoInstance;
    let loansAddress = accounts[0];
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await Mock.new();
        daiInstance = await Mock.new();
        instance = await DAIPool.new();
        lenderInfoInstance = await LenderInfo.new(zdaiInstance.address, instance.address);

        await instance.initialize(
            zdaiInstance.address,
            daiInstance.address,
            lenderInfoInstance.address,
            loansAddress,
        );
    });

    withData({
        _1_basic: [accounts[1], loansAddress, true, 10, undefined, false],
        _2_notLoan: [accounts[1], accounts[2], true, 10, 'Address is not Loans contract.', true],
        _4_transferFail: [accounts[1], loansAddress, false, 200, 'Transfer from was not successful.', true],
    }, function(borrower, sender, transferFrom, amountToRepay, expectedErrorMessage, mustFail) {
        it(t('user', 'repayDai', 'Should able (or not) to repay loan.', mustFail), async function() {
            // Setup
            const encodeTransferFrom = erc20InterfaceEncoder.encodeTransferFrom();
            await daiInstance.givenMethodReturnBool(encodeTransferFrom, transferFrom);

            try {
                // Invocation
                const result = await instance.repayDai(amountToRepay, borrower, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                daiPool
                    .daiRepaid(result)
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