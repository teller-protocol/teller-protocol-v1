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
const Loans = artifacts.require("./mock/base/TokenLoansMock.sol");

contract('TokenLoansWithdrawCollateralTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const pairAggregatorEncoder = new PairAggregatorEncoder(web3);
    const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);
    const collateralTokenOwner = accounts[9];
    let collateralToken;
    let instance;
    let oracleInstance;
    let lendingTokenInstance;

    beforeEach('Setup for each test', async () => {
        collateralToken = await LINKMock.new({ from: collateralTokenOwner });
        lendingTokenInstance = await Mock.new();
        oracleInstance = await Mock.new();
        const lendingPoolInstance = await Mock.new();
        const loanTermsConsInstance = await Mock.new();
        const settingsInstance = await Mock.new()
        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            collateralToken.address,
        )

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
        it(t('user', 'withdrawCollateral', 'Should able to withdraw collateral (tokens).', false), async function() {
            // Setup
            const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, loanCollateralRatio, 0, 0)
            await instance.setLoan(loanID, loanTerms, 0, 0, loanCollateral, 0, loanPrincipalOwed, loanInterestOwed, loanTerms.maxLoanAmount, ACTIVE, false)
            await instance.setTotalCollateral(currentTotalCollateral)

            await collateralToken.mintTo(instance.address, currentTotalCollateral, { from: collateralTokenOwner });

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
});