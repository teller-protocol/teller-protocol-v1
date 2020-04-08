// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LenderInfo = artifacts.require("./base/LenderInfo.sol");
const DAIPool = artifacts.require("./base/DAIPool.sol");

contract('DAIPoolCreateLoanTest', function (accounts) {
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
        _2_notLoanSender: [accounts[1], accounts[4], true, 10, 'Address is not Loans contract.', true],
        _3_transferFail: [accounts[1], loansAddress, false, 10, 'Transfer was not successful.', true],
    }, function(borrower, sender, transfer, amountToTransfer, expectedErrorMessage, mustFail) {
        it(t('user', 'createLoan', 'Should able (or not) to create loan.', mustFail), async function() {
            // Setup
            const encodeTransfer = erc20InterfaceEncoder.encodeTransfer();
            await daiInstance.givenMethodReturnBool(encodeTransfer, transfer);

            try {
                // Invocation
                const result = await instance.createLoan(amountToTransfer, borrower, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});