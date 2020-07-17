// JS Libraries
const assert = require('assert');
const withData = require('leche').withData;
const {
  t,
} = require('../utils/consts');

const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/TokenCollateralLoansMock.sol");

contract('TokenCollateralLoansRequireExpectedBalanceTest', function (accounts) {
    let erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    let collateralToken;
    let instance;
    
    beforeEach('Setup for each test', async () => {
        const settingsInstance = await Mock.new();
        const loanTermsConsInstance = await Mock.new();
        const lendingPoolInstance = await Mock.new();
        const oracleInstance = await Mock.new();
        collateralToken = await Mock.new();
        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            collateralToken.address,
        );
    });

    withData({
        _1_valid_transferFrom: [1000, 2000, 1000, false, undefined, false],
        _2_valid_transfer: [2000, 1000, 1000, true, undefined, false],
        _3_invalid_transferFrom: [1500, 5000, 10000, false, 'INV_BALANCE_AFTER_TRANSFER_FROM', true],
        _4_invalid_transfer: [7000, 1500, 3000, true, 'INV_BALANCE_AFTER_TRANSFER', true],
        _5_overflow_transferFrom: [4500, 3000, 4000, false, 'SafeMath: subtraction overflow', true],
        _6_invalid_transfer: [4300, 7500, 2500, true, 'SafeMath: subtraction overflow', true],
    }, function(initialBalance, finalBalance, expectedAmount, isTransfer, expectedErrorMessage, mustFail) {
        it(t('user', 'requireExpectedBalance', 'Should able to check balance after transferring/from.', mustFail), async function() {

            const encodeBalanceOf = erc20InterfaceEncoder.encodeBalanceOf();
            await collateralToken.givenMethodReturnUint(encodeBalanceOf, finalBalance);

            // Invocation
            try {
                await instance.externalRequireExpectedBalance(
                    initialBalance, 
                    expectedAmount, 
                    isTransfer
                );

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert(error.message.includes(expectedErrorMessage));
            }
        });
    });
});