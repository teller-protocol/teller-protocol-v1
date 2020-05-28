// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('LendingPoolCreateLoanTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    let instance;
    let zTokenInstance;
    let daiInstance;
    let lendersInstance;
    let interestConsensusInstance;
    let cTokenInstance;
    let loansAddress = accounts[0];
    
    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        daiInstance = await Mock.new();
        interestConsensusInstance = await Mock.new();
        cTokenInstance = await Mock.new()
        const settingsInstance = await Mock.new();
        console.log('deployed all mocks')
        instance = await LendingPool.new();
        console.log('deployed instance')

        lendersInstance = await Lenders.new(
          zTokenInstance.address,
          instance.address,
          interestConsensusInstance.address
        );
        console.log('deployed lenders')

        await instance.initialize(
            zTokenInstance.address,
            daiInstance.address,
            lendersInstance.address,
            loansAddress,
            cTokenInstance.address,
            settingsInstance.address
        );
        console.log('initialized')

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