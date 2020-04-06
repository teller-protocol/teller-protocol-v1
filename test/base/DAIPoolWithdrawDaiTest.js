// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { daiPool } = require('../utils/events');
const BurnableInterfaceEncoder = require('../utils/encoders/BurnableInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LenderInfo = artifacts.require("./base/LenderInfo.sol");
const DAIPool = artifacts.require("./base/DAIPool.sol");

contract('DAIPoolWithdrawDaiTest', function (accounts) {
    const burnableInterfaceEncoder = new BurnableInterfaceEncoder(web3);
    let instance;
    let zdaiInstance;
    let daiInstance;
    let lenderInfoInstance;
    let loansInstance;
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await Mock.new();
        daiInstance = await Mock.new();
        loansInstance = await Mock.new();
        instance = await DAIPool.new();
        lenderInfoInstance = await LenderInfo.new(zdaiInstance.address, instance.address);

        await instance.initialize(
            zdaiInstance.address,
            daiInstance.address,
            lenderInfoInstance.address,
            loansInstance.address,
        );
    });

    withData({
        _1_basic: [accounts[0], 1000, 100, true, 10, undefined, false],
        _2_notEnoughDai: [accounts[1], 150, 200, true, 151, 'Not enough DAI balance.', true],
        _3_notEnoughZDai: [accounts[1], 210, 200, true, 201, 'Not enough zDAI balance.', true],
        _4_transferFail: [accounts[1], 2000, 200, false, 50, 'Transfer was not successful.', true],
    }, function(recipient, daiBalance, zdaiBalance, transfer, amountToWithdraw, expectedErrorMessage, mustFail) {
        it(t('user', 'withdrawDai', 'Should able (or not) to withdraw DAIs.', mustFail), async function() {
            // Setup
            const encodeBalanceOf = burnableInterfaceEncoder.encodeBalanceOf();
            await daiInstance.givenMethodReturnUint(encodeBalanceOf, daiBalance);
            await zdaiInstance.givenMethodReturnUint(encodeBalanceOf, zdaiBalance);
            const encodeTransfer = burnableInterfaceEncoder.encodeTransfer();
            await daiInstance.givenMethodReturnBool(encodeTransfer, transfer);

            try {
                // Invocation
                const result = await instance.withdrawDai(amountToWithdraw, { from: recipient });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                daiPool
                    .daiWithdrew(result)
                    .emitted(recipient, amountToWithdraw);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});