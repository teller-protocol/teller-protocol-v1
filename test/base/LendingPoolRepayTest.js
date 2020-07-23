// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const CompoundInterfaceEncoder = require('../utils/encoders/CompoundInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('LendingPoolRepayTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const compoundInterfaceEncoder = new CompoundInterfaceEncoder(web3);

    let instance;
    let zTokenInstance;
    let daiInstance;
    let lendersInstance;
    let interestConsensusInstance;
    let cTokenInstance;
    let settingsInstance;
    let loansAddress = accounts[0];

    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        daiInstance = await Mock.new();
        instance = await LendingPool.new();
        interestConsensusInstance = await Mock.new();
        cTokenInstance = await Mock.new()
        settingsInstance = await Mock.new();

        lendersInstance = await Lenders.new(
          zTokenInstance.address,
          instance.address,
          interestConsensusInstance.address
        );
    });

    withData({
        _1_cTokenSupported_basic: [accounts[1], loansAddress, true, true, 10, false, undefined, false],
        _2_cTokenSupported_notLoan: [accounts[1], accounts[2], true, true, 10, false, 'Address is not Loans contract.', true],
        _3_cTokenSupported_transferFail: [accounts[1], loansAddress, true, false, 200, false, "TransferFrom wasn't successful.", true],
        _4_cTokenSupported_compoundFail: [accounts[1], loansAddress, true, true, 10, true, 'COMPOUND_DEPOSIT_ERROR', true],
        _6_cTokenNotSupported_basic: [accounts[1], loansAddress, false, true, 10, false, undefined, false],
        _7_cTokenNotSupported_notLoan: [accounts[1], accounts[2], false, true, 10, false, 'Address is not Loans contract.', true],
        _8_cTokenNotSupported_transferFail: [accounts[1], loansAddress, false, false, 200, false, "TransferFrom wasn't successful.", true],
    }, function(
        borrower,
        sender,
        isCTokenSupported,
        transferFrom,
        amountToRepay,
        compoundFails,
        allowance,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'repay', 'Should able (or not) to repay loan.', mustFail), async function() {
            // Setup
            const cTokenAddress = isCTokenSupported ? cTokenInstance.address : NULL_ADDRESS;
            await instance.initialize(
                zTokenInstance.address,
                daiInstance.address,
                lendersInstance.address,
                loansAddress,
                cTokenAddress,
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
