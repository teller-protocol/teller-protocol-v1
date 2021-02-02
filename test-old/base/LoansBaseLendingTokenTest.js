// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const LendingPoolInterfaceEncoder = require('../utils/encoders/LendingPoolInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");

// Libraries
const LoanLib = artifacts.require("../util/LoanLib.sol");

contract('LoansBaseLendingTokenTest', function (accounts) {
    const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);
    let instance;
    let lendingPoolInstance;
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        const loanTermsConsInstance = await Mock.new();
        const settingsInstance = await Mock.new();
        const collateralTokenInstance = await Mock.new();
        const loanLib = await LoanLib.new();
        await Loans.link("LoanLib", loanLib.address);
        instance = await Loans.new();
        await instance.initialize(
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            collateralTokenInstance.address,
        );
    });

    withData({
        _1_basic: [0],
        _2_empty_address: [-1],
    }, function(lendingTokenIndex) {
        it(t('user', 'lendingToken', 'Should able to get the lending token address.', false), async function() {
            // Setup
            const lendingTokenAddress = lendingTokenIndex === -1 ? NULL_ADDRESS: accounts[lendingTokenIndex];
            const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken();
            await lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenAddress);

            // Invocation
            const result = await instance.lendingToken();

            // Assertions
            assert.equal(result, lendingTokenAddress);
        })
    })
})