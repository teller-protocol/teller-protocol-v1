// JS Libraries
const withData = require('leche').withData;
const { t } = require('./utils/consts');

// Mock contracts
const TokenMock = artifacts.require("./mock/token/SimpleToken.sol");
const DAOMock = artifacts.require("./mock/util/Mock.sol");
const ZDai = artifacts.require("./ZDai.sol");

// Smart contracts
const ZeroCollateralMock = artifacts.require("./mock/base/ZeroCollateralMock.sol");

contract('ZeroCollateralHasActiveBorrowTest', function (accounts) {
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
        const newEstimatedGas = await ZeroCollateralMock.new.estimateGas(...params);
        instance = await ZeroCollateralMock.new(
            ...params,
            { from: owner, gas: newEstimatedGas.toString() }
        );
        assert(instance);
        assert(instance.address);

        await zdaiInstance.addMinter(instance.address);
    });

    withData({
        _1_basic: [accounts[0], 1, accounts[0], true],
        _2_notActive: [accounts[1], 8, accounts[0], false],
    }, function(borrowerAddressToMock, borrowId, borrowerAddressToTest, expectedResult ) {
        it(t('borrower', 'hasActiveBorrow', 'Should be able to verify if a borrower has an active borrow or not.', false), async function() {
            // Setup
            await instance.mockBorrowInfo(borrowerAddressToMock, borrowId);

            // Invocation
            const result = await instance.hasActiveBorrow(borrowerAddressToTest);

            // Assertions
            assert.equal(result.toString(), expectedResult.toString());
        });
    });
});