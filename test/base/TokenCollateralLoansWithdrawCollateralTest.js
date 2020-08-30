// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, ACTIVE } = require('../utils/consts');
const { loans } = require('../utils/events');
const { createLoanTerms } = require('../utils/structs');

const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const PairAggregatorEncoder = require('../utils/encoders/PairAggregatorEncoder');
const LendingPoolInterfaceEncoder = require('../utils/encoders/LendingPoolInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const LINKMock = artifacts.require("./mock/token/LINKMock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/TokenCollateralLoansMock.sol");

contract('TokenCollateralLoansWithdrawCollateralTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const pairAggregatorEncoder = new PairAggregatorEncoder(web3);
    const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);
    const collateralTokenOwner = accounts[9];
    let instance;
    let oracleInstance;
    let lendingTokenInstance;
    let lendingPoolInstance;
    let loanTermsConsInstance;
    let settingsInstance;
    let atmSettingsInstance;

    beforeEach('Setup for each test', async () => {
        lendingTokenInstance = await Mock.new();
        oracleInstance = await Mock.new();
        lendingPoolInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        settingsInstance = await Mock.new()
        atmSettingsInstance = await Mock.new();
        instance = await Loans.new();

        const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken();
        await lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address);
    });

    withData({
        _1_more_than_allowed: [1, accounts[1], 10000000, 2564000, 5410, 40000, 18, 65432, 5161305000000000, accounts[1], 10000, false, undefined],
        _2_non_borrower: [2, accounts[1], 0, 0, 0, 0, 0, 0, 0, accounts[2], 0, true, 'CALLER_DOESNT_OWN_LOAN'],
        _3_withdraw_zero: [3, accounts[1], 0, 0, 0, 0, 0, 0, 0, accounts[1], 0, true, 'CANNOT_WITHDRAW_ZERO'],
    }, function(
        loanID,
        loanBorrower,
        loanPrincipalOwed,
        loanInterestOwed,
        loanCollateralRatio,
        loanCollateral,
        tokenDecimals,
        currentTotalCollateral,
        oraclePrice,
        borrowerAddress,
        withdrawalAmount,
        mustFail,
        expectedErrorMessage
    ) {
        it(t('user', 'withdrawCollateral', 'Should able to withdraw collateral (tokens).', mustFail), async function() {
            // Setup
            const collateralToken = await LINKMock.new({ from: collateralTokenOwner });
            await instance.initialize(
                oracleInstance.address,
                lendingPoolInstance.address,
                loanTermsConsInstance.address,
                settingsInstance.address,
                collateralToken.address,
            )

            const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, loanCollateralRatio, 0, 0)
            await instance.setLoan(loanID, loanTerms, 0, 0, loanCollateral, 0, loanPrincipalOwed, loanInterestOwed, loanTerms.maxLoanAmount, ACTIVE, false)
            await instance.setTotalCollateral(currentTotalCollateral)

            await collateralToken.mint(instance.address, currentTotalCollateral, { from: collateralTokenOwner });

            // encode current token price
            const encodeGetLatestAnswer = pairAggregatorEncoder.encodeGetLatestAnswer();
            await oracleInstance.givenMethodReturnUint(encodeGetLatestAnswer, oraclePrice.toString());

            // encode token decimals
            const encodeDecimals = erc20InterfaceEncoder.encodeDecimals();
            await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, tokenDecimals);
            try {
                const initialContractCollateralTokenBalance = await collateralToken.balanceOf(instance.address)

                // Invocation
                const result = await instance.withdrawCollateral(withdrawalAmount.toString(), loanID, { from: borrowerAddress })
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                const finalTotalCollateral = await instance.totalCollateral();
                const finalContractCollateralTokenBalance = await collateralToken.balanceOf(instance.address)

                const loanTotalOwed = loanPrincipalOwed + loanInterestOwed
                const withdrawalAllowed = loanCollateral - Math.floor((Math.floor((loanTotalOwed * loanCollateralRatio) / 10000) * oraclePrice) / (10 ** tokenDecimals))
                const paidOut = Math.min(withdrawalAllowed, withdrawalAmount)

                const loanInfo = await instance.loans(loanID);

                loans
                    .collateralWithdrawn(result)
                    .emitted(loanID, loanBorrower, paidOut);

                assert.equal(parseInt(loanInfo.collateral), (loanCollateral - paidOut));
                assert.equal(currentTotalCollateral - paidOut, parseInt(finalTotalCollateral));
                assert.equal(parseInt(initialContractCollateralTokenBalance) - paidOut, parseInt(finalContractCollateralTokenBalance));
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_not_enough_balance: [true, 4917, 1, accounts[1], 10000000, 2564000, 5410, 40000, 18, 65432, 5161305000000000, accounts[1], 4918, true, 'NOT_ENOUGH_TOKENS_BALANCE'],
        _2_transfer_fail: [false, 4918, 1, accounts[1], 10000000, 2564000, 5410, 40000, 18, 65432, 5161305000000000, accounts[1], 10000, true, 'TOKENS_TRANSFER_FAILED'],
    }, function(
        transferResult,
        currentBalance,
        loanID,
        loanBorrower,
        loanPrincipalOwed,
        loanInterestOwed,
        loanCollateralRatio,
        loanCollateral,
        tokenDecimals,
        currentTotalCollateral,
        oraclePrice,
        borrowerAddress,
        withdrawalAmount,
        mustFail,
        expectedErrorMessage
    ) {
        it(t('user', 'withdrawCollateral#2', 'Should able (or not) to withdraw collateral (tokens).', false), async function() {
            // Setup
            const collateralToken = await Mock.new();
            await instance.initialize(
                oracleInstance.address,
                lendingPoolInstance.address,
                loanTermsConsInstance.address,
                settingsInstance.address,
                collateralToken.address,
            )

            const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, loanCollateralRatio, 0, 0)
            await instance.setLoan(loanID, loanTerms, 0, 0, loanCollateral, 0, loanPrincipalOwed, loanInterestOwed, loanTerms.maxLoanAmount, ACTIVE, false)
            await instance.setTotalCollateral(currentTotalCollateral)

            // encode balance of
            const encodeBalanceOf = erc20InterfaceEncoder.encodeBalanceOf();
            await collateralToken.givenMethodReturnUint(encodeBalanceOf, currentBalance);
            // encode transfer result
            const encodeTransfer = erc20InterfaceEncoder.encodeTransfer();
            await collateralToken.givenMethodReturnBool(encodeTransfer, transferResult);
            // encode current token price
            const encodeGetLatestAnswer = pairAggregatorEncoder.encodeGetLatestAnswer();
            await oracleInstance.givenMethodReturnUint(encodeGetLatestAnswer, oraclePrice.toString());
            // encode token decimals
            const encodeDecimals = erc20InterfaceEncoder.encodeDecimals();
            await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, tokenDecimals);
            try {
                // Invocation
                const result = await instance.withdrawCollateral(withdrawalAmount.toString(), loanID, { from: borrowerAddress })
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                const loanTotalOwed = loanPrincipalOwed + loanInterestOwed
                const withdrawalAllowed = loanCollateral - Math.floor((Math.floor((loanTotalOwed * loanCollateralRatio) / 10000) * oraclePrice) / (10 ** tokenDecimals))
                const paidOut = Math.min(withdrawalAllowed, withdrawalAmount)
                loans
                    .collateralWithdrawn(result)
                    .emitted(loanID, loanBorrower, paidOut);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});