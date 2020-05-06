// JS Libraries
const withData = require('leche').withData;
const { t, FIVE_MIN, NULL_ADDRESS, createLoanTerms, ACTIVE } = require('../utils/consts');

const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const PairAggregatorEncoder = require('../utils/encoders/PairAggregatorEncoder');
const LendingPoolInterfaceEncoder = require('../utils/encoders/LendingPoolInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansMock.sol");

contract('LoansWithdrawCollateralTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const pairAggregatorEncoder = new PairAggregatorEncoder(web3);
    const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);

    let instance;
    let oracleInstance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let lendingTokenInstance;

    const mockLoanID = 7
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        lendingTokenInstance = await Mock.new();
        oracleInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        instance = await Loans.new(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            FIVE_MIN
        );
    });

    withData({
        _1_non_borrower: [accounts[1], 0, 0, 0, 0, 0, 0, accounts[2], 0, true, 'CALLER_DOESNT_OWN_LOAN'],
        _2_withdraw_zero: [accounts[1], 0, 0, 0, 0, 0, 0, accounts[1], 0, true, 'CANNOT_WITHDRAW_ZERO'],
        _3_more_than_allowed: [accounts[1], 12564000, 5410, 40000, 18, 65432, 5161305000000000, accounts[1], 10000, false, undefined],
        _4_less_than_allowed: [accounts[1], 12564000, 5410, 40000, 18, 65432, 5161305000000000, accounts[1], 1000, false, undefined],
        _5_none_allowed: [accounts[1], 12564000, 5410, 35082, 18, 65432, 5161305000000000, accounts[1], 1000, false, undefined],
    }, function(
        loanBorrower,
        loanTotalOwed,
        loanCollateralRatio,
        loanCollateral,
        tokenDecimals,
        totalCollateral,
        oraclePrice,
        msgSender,
        withdrawalAmount,
        mustFail,
        expectedErrorMessage
    ) {
        it(t('user', 'depositCollateral', 'Should able to deposit collateral.', false), async function() {
            // Setup
            const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, loanCollateralRatio, 0, 0)
            await instance.setLoan(mockLoanID, loanTerms, 0, 0, loanCollateral, 0, loanTotalOwed, ACTIVE, false)
            await instance.setTotalCollateral(totalCollateral)

            // give the contract collateral through a deposit (mock has a fallback)
            await web3.eth.sendTransaction({ from: accounts[1], to: instance.address, value: totalCollateral });

            // encode current token price
            const encodeGetLatestAnswer = pairAggregatorEncoder.encodeGetLatestAnswer();
            await oracleInstance.givenMethodReturnUint(encodeGetLatestAnswer, oraclePrice.toString());

            // encode lending token address
            const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken();
            await lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address);

            // encode token decimals
            const encodeDecimals = erc20InterfaceEncoder.encodeDecimals();
            await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, tokenDecimals);
            try {
                const contractBalBefore = await web3.eth.getBalance(instance.address)

                await instance.withdrawCollateral(withdrawalAmount, mockLoanID, { from: msgSender })
                
                const totalAfter = await instance.totalCollateral.call()
                const contractBalAfter = await web3.eth.getBalance(instance.address)

                const withdrawalAllowed = loanCollateral - Math.floor((Math.floor((loanTotalOwed * loanCollateralRatio) / 10000) * oraclePrice) / (10 ** tokenDecimals))
                const paidOut = Math.min(withdrawalAllowed, withdrawalAmount)

                let loan = await instance.loans.call(mockLoanID)

                assert.equal(parseInt(loan['collateral']), (loanCollateral - paidOut))
                assert.equal(totalCollateral - paidOut, parseInt(totalAfter))
                assert.equal(parseInt(contractBalBefore) - paidOut, parseInt(contractBalAfter))
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});