// JS Libraries
const withData = require('leche').withData;
const { t } = require('./utils/consts');

// Mock contracts
const TokenMock = artifacts.require("./mock/token/SimpleToken.sol");
const DAOMock = artifacts.require("./mock/util/Mock.sol");
const ZDai = artifacts.require("./ZDai.sol");

// Smart contracts
const ZeroCollateralMain = artifacts.require("./ZeroCollateralMain.sol");

contract('ZeroCollateralSetBorrowerAccountInfoTest', function (accounts) {
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
        _1_basicSpec: [accounts[0], 100, 10, 50],
        _2_basic: [accounts[1], 100, 30, 35],
        _3_zeroValues: [accounts[2], 0, 0, 0, 0, 0, 0, 0],
    }, function(
        borrowerAddress,
        maxLoan,
        interestRate,
        collateralNeeded
    ) {    
        it(t('user', 'set/get BorrowerAccountInfo', 'Should be able to set/get borrower account info.', false), async function() {
            // Setup
            const maxLoanWei = web3.utils.toWei(maxLoan.toString(), 'ether'); // DAI has 18 decimals

            // Invocation
            const result = await instance.setBorrowerAccountInfo(
                borrowerAddress,
                maxLoanWei,
                interestRate,
                collateralNeeded
            );
            
            // Assertions
            assert(result);
            const borrowInfoResult = await instance.borrowerAccounts(borrowerAddress);
            assert.equal(borrowInfoResult.maxLoan, maxLoanWei);
            assert.equal(borrowInfoResult.interestRate, interestRate);
            assert.equal(borrowInfoResult.collateralNeeded, collateralNeeded);
        });
    });
});