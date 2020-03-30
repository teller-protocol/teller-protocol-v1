// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { daiPool } = require('../utils/events');
const { createInstance } = require('../utils/contracts');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const MintableInterfaceEncoder = require('../utils/encoders/MintableInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LenderInfo = artifacts.require("./base/LenderInfo.sol");
const DAIPool = artifacts.require("./base/DAIPool.sol");

contract('DAIPoolDepositDaiTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const mintableInterfaceEncoder = new MintableInterfaceEncoder(web3);
    let instance;
    let zdaiInstance;
    let daiInstance;
    let lenderInfoInstance;
    let loanInfoInstance;

    afterEach('', async () => {
        await zdaiInstance.reset();
        await daiInstance.reset();
        await loanInfoInstance.reset();
    });
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await createInstance(Mock.new());
        daiInstance = await createInstance(Mock.new());
        loanInfoInstance = await createInstance(Mock.new());
        instance = await createInstance(DAIPool.new());
        lenderInfoInstance = await createInstance(LenderInfo.new(zdaiInstance.address, instance.address));

        await instance.initialize(
            zdaiInstance.address,
            daiInstance.address,
            lenderInfoInstance.address,
            loanInfoInstance.address,
        );
    });

    withData({
        _1_basic: [1, accounts[0], true, true, 1, undefined, false],
        _2_notEnoughAllowance: [49, accounts[1], true, true, 50, 'Not enough tokens allowed.', true],
        _3_notTransferFromEnoughBalance: [100, accounts[2], false, true, 100, 'Transfer from was not successful.', true],
        _4_notMint: [60, accounts[0], true, false, 60, 'Mint was not successful.', true],
    }, function(allowance, recipient, transferFrom, mint, amountToDeposit, expectedErrorMessage, mustFail) {
        it(t('user', 'depositDai', 'Should able (or not) to deposit DAIs.', mustFail), async function() {
            // Setup
            const encodeAllowance = erc20InterfaceEncoder.encodeAllowance();
            await daiInstance.givenMethodReturnUint(encodeAllowance, allowance);
            const encodeTransferFrom = erc20InterfaceEncoder.encodeTransferFrom();
            await daiInstance.givenMethodReturnBool(encodeTransferFrom, transferFrom);
            const encodeMint = mintableInterfaceEncoder.encodeMint();
            await zdaiInstance.givenMethodReturnBool(encodeMint, mint);

            try {
                // Invocation
                const result = await instance.depositDai(amountToDeposit, { from: recipient });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                daiPool
                    .daiDeposited(result)
                    .emitted(recipient, amountToDeposit);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
