// JS Libraries
const withData = require('leche').withData;
const {
    t
} = require('../utils/consts');
const {
    lendingPool
} = require('../utils/events');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const MintableInterfaceEncoder = require('../utils/encoders/MintableInterfaceEncoder');
const CompoundInterfaceEncoder = require('../utils/encoders/CompoundInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");
const ZToken = artifacts.require("./base/ZToken.sol");

contract('LendingPoolDepositTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const mintableInterfaceEncoder = new MintableInterfaceEncoder(web3);
    const compoundInterfaceEncoder = new CompoundInterfaceEncoder(web3);

    let instance;
    let zTokenInstance;
    let daiInstance;
    let lendersInstance;
    let loansInstance;
    let interestConsensusInstance;
    let cTokenInstance;
    let settingsInstance;
    let marketsInstance;

    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        daiInstance = await Mock.new();
        loansInstance = await Mock.new();
        interestConsensusInstance = await Mock.new();
        instance = await LendingPool.new();
        settingsInstance = await Mock.new();
        cTokenInstance = await Mock.new();
        marketsInstance = await Mock.new();

        lendersInstance = await Lenders.new(
            zTokenInstance.address,
            instance.address,
            interestConsensusInstance.address,
            marketsInstance.address,
        );

        await instance.initialize(
            zTokenInstance.address,
            daiInstance.address,
            lendersInstance.address,
            loansInstance.address,
            cTokenInstance.address,
            settingsInstance.address,
            marketsInstance.address,
        );
    });

    withData({
        _1_basic: [accounts[0], true, true, 1, false, 1000, undefined, false],
        _2_notTransferFromEnoughBalance: [accounts[2], false, true, 100, false, 1000, "LENDING_TRANSFER_FROM_FAILED", true],
        _3_notDepositIntoCompound: [accounts[2], true, true, 100, true, 1000, "COMPOUND_DEPOSIT_ERROR", true],
        _4_notMint: [accounts[0], true, false, 60, false, 1000, 'ZTOKEN_MINT_FAILED', true],
        _5_notAllowance: [accounts[0], true, true, 1, false, 0, "LEND_TOKEN_NOT_ENOUGH_ALLOWANCE", true],
    }, function (
        recipient,
        transferFrom,
        mint,
        amountToDeposit,
        compoundFails,
        allowance,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'deposit', 'Should able (or not) to deposit DAIs.', mustFail), async function () {
            // Setup
            const encodeTransferFrom = erc20InterfaceEncoder.encodeTransferFrom();
            await daiInstance.givenMethodReturnBool(encodeTransferFrom, transferFrom);
            const encodeMint = mintableInterfaceEncoder.encodeMint();
            await zTokenInstance.givenMethodReturnBool(encodeMint, mint);
            const mintResponse = compoundFails ? 1 : 0
            const encodeCompMint = compoundInterfaceEncoder.encodeMint();
            await cTokenInstance.givenMethodReturnUint(encodeCompMint, mintResponse);
            const encodeAllowance = erc20InterfaceEncoder.encodeAllowance();
            await daiInstance.givenMethodReturnUint(encodeAllowance, allowance);

            try {
                // Invocation
                const result = await instance.deposit(amountToDeposit, {
                    from: recipient
                });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                lendingPool
                    .tokenDeposited(result)
                    .emitted(recipient, amountToDeposit);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_zTokenNoMinter: [accounts[0], true, 60, false, 1000, 'MinterRole: caller does not have the Minter role', true],
    }, function (
        recipient,
        transferFrom,
        amountToDeposit,
        compoundFails,
        allowance,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'deposit', 'Should able (or not) to deposit DAIs.', mustFail), async function () {
            // Setup
            // Overriding instances created during beforeEach() as a real ZToken instance
            // is needed for this test. 
            zTokenInstance = await ZToken.new("ZToken Name", "ZTN", 0);
            lendersInstance = await Lenders.new();

            await lendersInstance.initialize(
                zTokenInstance.address,
                instance.address,
                interestConsensusInstance.address,
                settingsInstance.address,
                marketsInstance.address,
            );
            instance = await LendingPool.new();
            await instance.initialize(
                zTokenInstance.address,
                daiInstance.address,
                lendersInstance.address,
                loansInstance.address,
                cTokenInstance.address,
                settingsInstance.address,
                marketsInstance.address,
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
                const result = await instance.deposit(amountToDeposit, {
                    from: recipient
                });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                // Making sure LendingPool contract is not a ZToken minter
                assert.isFalse((await zTokenInstance.isMinter(instance.address)), 'LendingPool should not be minter in this test.');
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});