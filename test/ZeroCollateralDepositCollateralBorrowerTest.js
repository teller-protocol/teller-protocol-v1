// JS Libraries
const withData = require('leche').withData;
const BigNumber = require('bignumber.js');
const { t } = require('./utils/consts');
const { zeroCollateral } = require('./utils/events');

// Mock contracts
const TokenMock = artifacts.require("./mock/token/SimpleToken.sol");
const DAOMock = artifacts.require("./mock/util/Mock.sol");
const ZDai = artifacts.require("./ZDai.sol");

// Smart contracts
const ZeroCollateralMain = artifacts.require("./ZeroCollateralMain.sol");

contract('ZeroCollateralDepositCollateralBorrowerTest', function (accounts) {
    const owner = accounts[0];
    let instance;
    
    beforeEach('Setup for each test', async () => {
        const zdaiInstance = await ZDai.new(
            'Zero Collateral Unit',
            'ZCU',
            18
        );
        assert(zdaiInstance);
        assert(zdaiInstance.address);


        const daiTokenInstance = await TokenMock.new();
        assert(daiTokenInstance);
        assert(daiTokenInstance.address);

        const daoTokenInstance = await DAOMock.new();
        assert(daoTokenInstance);
        assert(daoTokenInstance.address);

        const params = [
            daiTokenInstance.address,
            zdaiInstance.address,
            daoTokenInstance.address,
        ];
        const newEstimatedGas = await ZeroCollateralMain.new.estimateGas(...params);
        instance = await ZeroCollateralMain.new(
            ...params,
            { from: owner, gas: newEstimatedGas.toString() }
        );
        assert(instance);
        assert(instance.address);

        await zdaiInstance.addMinter(instance.address);
    });

    withData({
        _1_basic: [owner, 1],
        _2_withoutEther: [owner, 0]
    }, function(borrower, amount) {
        it(t('user', 'depositCollateralBorrower', 'Should be able to deposit ETH as collateral.', false), async function() {
            // Setup
            const collateralLockedInitial = await instance.collateralLocked();
            const amountWei = web3.utils.toWei(amount.toString(), 'ether');

            // Invocation
            const result = await instance.depositCollateralBorrower({ from: borrower, value: amountWei });
            
            // Assertions
            assert(result);
            zeroCollateral
                .collateralDeposited(result)
                .emitted(borrower, amountWei);

            const collateralLockedFinal = await instance.collateralLocked();
            const collateralLockedDiff = BigNumber(collateralLockedFinal.toString()).minus(BigNumber(collateralLockedInitial.toString()));
            assert.equal(collateralLockedDiff.toString(), amountWei.toString());
        });
    });
});