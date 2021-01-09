// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const CompoundInterfaceEncoder = require('../utils/encoders/CompoundInterfaceEncoder');
const CTokenInterfaceEncoder = require('../utils/encoders/CTokenInterfaceEncoder')
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./mock/base/LendingPoolMock.sol");

contract('LendingPoolCreateLoanTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const compoundInterfaceEncoder = new CompoundInterfaceEncoder(web3);
    const cTokenEncoder = new CTokenInterfaceEncoder(web3)
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let instance;
    let tTokenInstance;
    let daiInstance;
    let lendersInstance;
    let cTokenInstance;
    let settingsInstance;
    let loansInstance;
    
    beforeEach('Setup for each test', async () => {
        tTokenInstance = await Mock.new();
        daiInstance = await Mock.new();
        cTokenInstance = await Mock.new();
        settingsInstance = await Mock.new();
        loansInstance = await Mock.new();
        instance = await LendingPool.new();

        await cTokenInstance.givenMethodReturnAddress(
          cTokenEncoder.encodeUnderlying(),
          daiInstance.address
        )

        lendersInstance = await Lenders.new(
          tTokenInstance.address,
          instance.address,
        );

        await instance.initialize(
            tTokenInstance.address,
            daiInstance.address,
            lendersInstance.address,
            loansInstance.address,
            settingsInstance.address,
        );
    });

    withData({
        _1_basic: [accounts[1], true, true, 10, false, 1000, undefined, false],
        _2_notLoanSender: [accounts[1], false, true, 10, false, 1000, 'ADDRESS_ISNT_LOANS_CONTRACT', true],
        _3_transferFail: [accounts[1], true, false, 10, false, 1000, 'SafeERC20: ERC20 operation did not succeed', true],
        _4_compoundFails: [accounts[1], true, true, 10, true, 1000, 'COMPOUND_REDEEM_UNDERLYING_ERROR', true],
        _5_balanceFails: [accounts[1], true, true, 10, false, 0, 'LENDING_TOKEN_NOT_ENOUGH_BALANCE', true],
    }, function(
        borrower,
        mockRequireIsLoan,
        transfer,
        amountToTransfer,
        compoundFails,
        balanceOf,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'createLoan', 'Should able (or not) to create loan.', mustFail), async function() {
            // Setup
            const sender = accounts[1];
            await instance.mockRequireIsLoan(mockRequireIsLoan);
            await settingsInstance.givenMethodReturnAddress(
                settingsInterfaceEncoder.encodeGetCTokenAddress(),
                cTokenInstance.address
            );

            const encodeTransfer = erc20InterfaceEncoder.encodeTransfer();
            await daiInstance.givenMethodReturnBool(encodeTransfer, transfer);
            
            const redeemResponse = compoundFails ? 1 : 0
            const encodeRedeemUnderlying = compoundInterfaceEncoder.encodeRedeemUnderlying();
            await cTokenInstance.givenMethodReturnUint(encodeRedeemUnderlying, redeemResponse);

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
