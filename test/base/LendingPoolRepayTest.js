// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const CompoundInterfaceEncoder = require('../utils/encoders/CompoundInterfaceEncoder');
const CTokenInterfaceEncoder = require('../utils/encoders/CTokenInterfaceEncoder')
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./mock/base/LendingPoolMock.sol");

contract('LendingPoolRepayTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const compoundInterfaceEncoder = new CompoundInterfaceEncoder(web3);
    const cTokenEncoder = new CTokenInterfaceEncoder(web3)
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);

    let instance;
    let tTokenInstance;
    let daiInstance;
    let lendersInstance;
    let interestConsensusInstance;
    let cTokenInstance;
    let settingsInstance;
    let loansInstance;
    
    beforeEach('Setup for each test', async () => {
        tTokenInstance = await Mock.new();
        daiInstance = await Mock.new();
        instance = await LendingPool.new();
        interestConsensusInstance = await Mock.new();
        cTokenInstance = await Mock.new()
        settingsInstance = await Mock.new();

        await cTokenInstance.givenMethodReturnAddress(
          cTokenEncoder.encodeUnderlying(),
          daiInstance.address
        )
        marketsInstance = await Mock.new();
        loansInstance = await Mock.new();

        lendersInstance = await Lenders.new();
        await lendersInstance.initialize(
            tTokenInstance.address,
            instance.address,
            interestConsensusInstance.address,
            settingsInstance.address,
        );
        await settingsInstance.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeMarketsState(),
            marketsInstance.address
        );
    });

    withData({
        _1_cTokenSupported_basic: [accounts[1], true, true, true, 10, false, 1000, undefined, false],
        _2_cTokenSupported_notLoan: [accounts[1], true, false, true, 10, false, 1000, 'ADDRESS_ISNT_LOANS_CONTRACT', true],
        _3_cTokenSupported_transferFail: [accounts[1], true, true, false, 200, false, 1000, "LENDING_TRANSFER_FROM_FAILED", true],
        _4_cTokenSupported_compoundFail: [accounts[1], true, true, true, 10, true, 1000, 'COMPOUND_DEPOSIT_ERROR', true],
        _6_cTokenNotSupported_basic: [accounts[1], false, true, true, 10, false, 1000, undefined, false],
        _7_cTokenNotSupported_notLoan: [accounts[1], false, false, true, 10, false, 1000, 'ADDRESS_ISNT_LOANS_CONTRACT', true],
        _8_cTokenNotSupported_transferFail: [accounts[1], false, true, false, 200, false, 1000, "LENDING_TRANSFER_FROM_FAILED", true],
        _9_cTokenNotSupported_allowanceFail: [accounts[1], false, true, true, 10, false, 0, "LEND_TOKEN_NOT_ENOUGH_ALLOWANCE", true],
    }, function(
        borrower,
        isCTokenSupported,
        mockRequireIsLoan,
        transferFrom,
        amountToRepay,
        compoundFails,
        allowance,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'repay', 'Should able (or not) to repay loan.', mustFail), async function() {
            // Setup
            const sender = accounts[1];
            if(isCTokenSupported) {
                await settingsInstance.givenMethodReturnAddress(
                    settingsInterfaceEncoder.encodeGetCTokenAddress(),
                    cTokenInstance.address
                );
            }
            await instance.mockRequireIsLoan(mockRequireIsLoan);
            await instance.initialize(
                tTokenInstance.address,
                daiInstance.address,
                lendersInstance.address,
                loansInstance.address,
                settingsInstance.address,
            );
            const encodeTransferFrom = erc20InterfaceEncoder.encodeTransferFrom();
            await daiInstance.givenMethodReturnBool(encodeTransferFrom, transferFrom);
            
            const mintResponse = compoundFails ? 1 : 0
            const encodeCompMint = compoundInterfaceEncoder.encodeMint();
            await cTokenInstance.givenMethodReturnUint(encodeCompMint, mintResponse);

            const encodeAllowance = erc20InterfaceEncoder.encodeAllowance();
            await daiInstance.givenMethodReturnUint(encodeAllowance, allowance);
            
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