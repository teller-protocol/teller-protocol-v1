// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const CTokenEncoder = require('../utils/encoders/CTokenEncoder')
const SettingsEncoder = require('../utils/encoders/SettingsEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DAIMock = artifacts.require("./mock/token/DAIMock.sol")

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./mock/base/LendingPoolMock.sol");

contract('LendingPoolRepayTest', function (accounts) {
    const cTokenEncoder = new CTokenEncoder(web3)
    const settingsEncoder = new SettingsEncoder(web3);

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
        daiInstance = await DAIMock.new();
        instance = await LendingPool.new();
        interestConsensusInstance = await Mock.new();
        cTokenInstance = await Mock.new()
        settingsInstance = await Mock.new();

        await cTokenInstance.givenMethodReturnAddress(
          cTokenEncoder.encodeUnderlying(),
          daiInstance.address
        )
        let marketsInstance = await Mock.new();
        loansInstance = await Mock.new();

        lendersInstance = await Lenders.new();
        await lendersInstance.initialize(
            tTokenInstance.address,
            instance.address,
            interestConsensusInstance.address,
            settingsInstance.address,
        );
        await settingsInstance.givenMethodReturnAddress(
            settingsEncoder.encodeMarketsState(),
            marketsInstance.address
        );
    });

    withData({
        _1_cTokenSupported_basic: [accounts[1], true, true, true, 10, 5, false, 1000, undefined, false],
        _2_cTokenSupported_notLoan: [accounts[1], true, false, true, 10, 5, false, 1000, 'ADDRESS_ISNT_LOANS_CONTRACT', true],
        _3_cTokenSupported_transferFail: [accounts[1], true, true, false, 200, 5, false, 1000, "SafeERC20: ERC20 operation did not succeed", true],
        _4_cTokenSupported_compoundFail: [accounts[1], true, true, true, 10, 5, true, 1000, 'COMPOUND_DEPOSIT_ERROR', true],
        _6_cTokenNotSupported_basic: [accounts[1], false, true, true, 10, 5, false, 1000, undefined, false],
        _7_cTokenNotSupported_notLoan: [accounts[1], false, false, true, 10, 5, false, 1000, 'ADDRESS_ISNT_LOANS_CONTRACT', true],
        _8_cTokenNotSupported_transferFail: [accounts[1], false, true, false, 200, 5, false, 1000, "SafeERC20: ERC20 operation did not succeed", true],
        _9_cTokenNotSupported_allowanceFail: [accounts[1], false, true, true, 10, 5, false, 0, "LEND_TOKEN_NOT_ENOUGH_ALLOWANCE", true],
    }, function(
        borrower,
        isCTokenSupported,
        mockRequireIsLoan,
        transferFrom,
        principalToRepay,
        interestToRepay,
        compoundFails,
        allowance,
        expectedErrorMessage,
        mustFail
    ) {
        const approvedAmount = allowance;
        it(t('user', 'repay', 'Should able (or not) to repay loan.', mustFail), async function() {
            const totalToRepay = principalToRepay + interestToRepay
            // Setup
            const sender = accounts[1];
            if(isCTokenSupported) {
                await settingsInstance.givenMethodReturnAddress(
                    settingsEncoder.encodeGetCTokenAddress(),
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
            
            const mintResponse = compoundFails ? 1 : 0
            const encodeCompMint = cTokenEncoder.encodeMint();
            await cTokenInstance.givenMethodReturnUint(encodeCompMint, mintResponse);
            
            await daiInstance.mint(sender, totalToRepay);
            await daiInstance.approve(instance.address, approvedAmount, { from: sender });
            if (!transferFrom) {
                await daiInstance.mockTransferFromReturnFalse();
            }
            
            try {
                // Invocation
                const result = await instance.repay(principalToRepay, interestToRepay, borrower, { from: sender });
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                lendingPool
                    .tokenRepaid(result)
                    .emitted(borrower, totalToRepay);
            } catch (error) {
                // Assertions
                assert(mustFail, error.message);
                assert.equal(error.reason, expectedErrorMessage, error.message);
            }
        });
    });
});
