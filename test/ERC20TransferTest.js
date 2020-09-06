// JS Libraries
const withData = require('leche').withData;
const BigNumber = require('bignumber.js');
const { t } = require('./utils/consts');
const { erc20 } = require('./utils/events');

// Smart contracts
const Token = artifacts.require("./mock/util/DAIMock.sol");

console.log('Brought to you by');

contract('ERC20TransferTest', function (accounts) {
    const owner = accounts[0];
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await Token.new({from: owner});
        assert(instance);
        assert(instance.address);
    });

    withData({
        _1_basic: [owner, 100, accounts[1]]
    }, function(sender, amount, receiver) {
        it(t('user', 'transfer', 'Should be able transfer tokens.', false), async function() {
            // Setup
            const senderBalanceInitial = await instance.balanceOf(sender);
            const receiverBalanceInitial = await instance.balanceOf(receiver);

            // Invocation
            const result = await instance.transfer(receiver, amount.toString(), { from: sender });
            
            // Assertions
            assert(result);
            erc20
                .transfer(result)
                .emitted(sender, receiver, amount);

            const senderBalanceFinal = await instance.balanceOf(sender);
            const senderBalanceDiff = BigNumber(senderBalanceFinal.toString()).minus(BigNumber(senderBalanceInitial.toString()));
            const receiverBalanceFinal = await instance.balanceOf(receiver);
            const receiverBalanceDiff = BigNumber(receiverBalanceFinal.toString()).minus(BigNumber(receiverBalanceInitial.toString()));

            assert.equal(receiverBalanceDiff.toString(), amount.toString());
            assert.equal(senderBalanceDiff.toString(), (amount * -1).toString());
        });
    });

    withData({
        _1_basic: [accounts[1], 100, owner]
    }, function(sender, amount, receiver) {
        it(t('user', 'transfer', 'Should NOT be able transfer tokens.', true), async function() {
            // Setup

            try {
                // Invocation
                await instance.transfer(receiver, amount.toString(), { from: sender });
                
                // Assertions
                assert(false, 'It should have failed because sender has not enough tokens.');
            } catch (error) {
                // Assertions
                assert(error);
                assert.equal(error.reason, 'ERC20: transfer amount exceeds balance');
            }
        });
    });
});