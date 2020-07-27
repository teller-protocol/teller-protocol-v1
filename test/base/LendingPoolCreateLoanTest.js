// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const CompoundInterfaceEncoder = require('../utils/encoders/CompoundInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('LendingPoolCreateLoanTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const compoundInterfaceEncoder = new CompoundInterfaceEncoder(web3);
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
        instance = await LendingPool.new();

        lendersInstance = await Lenders.new(
          zTokenInstance.address,
          instance.address,
          interestConsensusInstance.address
        );

        await instance.initialize(
            zTokenInstance.address,
            daiInstance.address,
            lendersInstance.address,
            loansAddress,
            cTokenInstance.address,
            settingsInstance.address
        );
    });

    withData({
        _1_basic: [accounts[1], loansAddress, true, 10, false, 1000, undefined, false],
        _2_notLoanSender: [accounts[1], accounts[4], true, 10, false, 1000, 'Address is not Loans contract.', true],
        _3_transferFail: [accounts[1], loansAddress, false, 10, false, 1000, 'Transfer was not successful.', true],
        _4_compoundFails: [accounts[1], loansAddress, true, 10, true, 1000, 'COMPOUND_WITHDRAWAL_ERROR', true],
        _5_balanceFails: [accounts[1], loansAddress, true, 10, false, 0, 'LENDING_TOKEN_NOT_ENOUGH_BALANCE', true],
    }, function(
        borrower,
        sender,
        transfer,
        amountToTransfer,
        compoundFails,
        balanceOf,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'createLoan', 'Should able (or not) to create loan.', mustFail), async function() {
            // Setup
            const encodeTransfer = erc20InterfaceEncoder.encodeTransfer();
            await daiInstance.givenMethodReturnBool(encodeTransfer, transfer);
            
            const redeemResponse = compoundFails ? 1 : 0
            const encodeRedeemUnderlying = compoundInterfaceEncoder.encodeRedeemUnderlying();
            await cTokenInstance.givenMethodReturnUint(encodeRedeemUnderlying, redeemResponse)
            
            const encodeBalanceOf = erc20InterfaceEncoder.encodeBalanceOf();
            await daiInstance.givenMethodReturnUint(encodeBalanceOf, balanceOf);

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