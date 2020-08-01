// JS Libraries
const withData = require('leche').withData;
const { t, toDecimals } = require('../utils/consts');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const BigNumber = require('bignumber.js');

// Smart contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");
const ERC20LibMock = artifacts.require("./mock/util/ERC20LibMock.sol");

contract('ERC20LibTokenTransferFromTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await ERC20LibMock.new();
    });

    withData({
        _1_basic: [1000, 1, 1000, 500, undefined, false],
        _2_basic: [2000, 2, 1000, 500, undefined, false],
        _3_basic: [3000, 3, 3000, 500, undefined, false],
        _4_basic: [4000, 4, 4000, 4000, undefined, false],
        _5_not_enough_allowance: [4000, 4, 2000, 3000, 'NOT_ENOUGH_TOKENS_ALLOWANCE', true],
        _6_not_enough_balance: [2000, 2, 2500, 2500, 'ERC20: transfer amount exceeds balance', true],
        _7_not_enough_balance: [2000, 2, 2500, 3000, 'NOT_ENOUGH_TOKENS_ALLOWANCE', true],
    }, function(
        initialBalance,
        recipientIndex,
        allowance,
        amount,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'tokenTransferFrom', 'Should able (or not) to transfer tokens.', mustFail), async function() {
            // Setup
            const token = await DAI.new();
            const sender = accounts[recipientIndex];
            const tokenDecimals  = await token.decimals();
            const amountWithDecimals = toDecimals(amount, tokenDecimals);
            const allowanceWithDecimals = toDecimals(allowance, tokenDecimals);
            const initialBalanceWithDecimals = toDecimals(initialBalance, tokenDecimals)
            await token.mint(
                sender,
                initialBalanceWithDecimals,
            );
            await token.approve(
                instance.address,
                allowanceWithDecimals,
                { from: sender },
            );
            const initialSenderBalanceWithDecimals = await token.balanceOf(sender);
            
            try {
                // Invocation
                const result = await instance.tokenTransferFrom(
                    token.address,
                    sender,
                    amountWithDecimals,
                    { from: sender },
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                const finalSenderBalanceWithDecimals = await token.balanceOf(sender);
                const finalBalanceWithDecimals = await token.balanceOf(instance.address);
                
                assert.equal(
                    finalBalanceWithDecimals.toString(),
                    amountWithDecimals.toFixed(0)
                );
                assert.equal(
                    BigNumber(initialSenderBalanceWithDecimals.toString()).minus(finalSenderBalanceWithDecimals.toString()).toFixed(0),
                    amountWithDecimals.toFixed(0)
                );
                
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_not_enough_balance: [1000, 1000, false, 2, 1000, 'TOKENS_TRANSFER_FROM_FAILED', true],
        _2_invalid_final_balance: [1000, 1000, true, 3, 1000, 'INV_BALANCE_AFTER_TRANSFER_FROM', true],
        _3_not_enough_allowance: [1000, 500, false, 4, 1000, 'NOT_ENOUGH_TOKENS_ALLOWANCE', true],
    }, function(
        initialBalance,
        allowance,
        transferFromResponse,
        senderIndex,
        amount,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'tokenTransferFrom#2', 'Should able (or not) to transfer from tokens.', mustFail), async function() {
            // Setup
            const token = await Mock.new();
            const sender = accounts[senderIndex];
            const amountWithDecimals = toDecimals(amount, 18);
            const allowanceWithDecimals = toDecimals(allowance, 18);
            const initialBalanceWithDecimals = toDecimals(initialBalance, 18);

            await token.givenMethodReturnUint(
                erc20InterfaceEncoder.encodeAllowance(),
                allowanceWithDecimals
            );
            await token.givenMethodReturnUint(
                erc20InterfaceEncoder.encodeBalanceOf(),
                initialBalanceWithDecimals
            );
            await token.givenMethodReturnBool(
                erc20InterfaceEncoder.encodeTransferFrom(),
                transferFromResponse
            );            
            
            try {
                // Invocation
                const result = await instance.tokenTransferFrom(
                    token.address,
                    sender,
                    amountWithDecimals,
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});