// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, ACTIVE, CLOSED, getLatestTimestamp, ONE_HOUR, ONE_DAY } = require('../utils/consts');
const { createLoanTerms } = require('../utils/structs');
const BigNumber = require('bignumber.js');

const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const PairAggregatorEncoder = require('../utils/encoders/PairAggregatorEncoder');
const LendingPoolInterfaceEncoder = require('../utils/encoders/LendingPoolInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/EtherLoansMock.sol");

contract('LoansLiquidateTest', function (accounts) {
    BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 })

    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const pairAggregatorEncoder = new PairAggregatorEncoder(web3);
    const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);

    let instance;
    let oracleInstance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let settingsInstance;

    const mockLoanID = 2831

    const totalCollateral = BigNumber("8000000000000000000") // 8 ETH
    const loanBorrower = accounts[3]
    const liquidator = accounts[4]

    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        lendingTokenInstance = await Mock.new();
        oracleInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        settingsInstance = await Mock.new()
        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address
        )

        // encode lending token address
        const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken();
        await lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address);
    });

    withData({
        _1_loan_expired: [1900000000, 32725581, BigNumber("6000000000000000000"), 6512, true, 300000, BigNumber("4721489128502654"), 6, false, undefined],
        _2_under_collateralised: [1900000000, 32725581, BigNumber("5942423100000000000"), 6512, false, 300000, BigNumber("4721489128502654"), 6, false, undefined],
        _3_doesnt_need_liquidating: [1900000000, 32725581, BigNumber("6000000000000000000"), 6512, false, 300000, BigNumber("4721489128502654"), 6, true, 'DOESNT_NEED_LIQUIDATION'],
    }, function (
        loanPrincipalOwed,
        loanInterestOwed,
        loanCollateral,
        loanCollateralRatio,
        loanExpired,
        loanDuration,
        oraclePrice,
        tokenDecimals,
        mustFail,
        expectedErrorMessage
    ) {
        it(t('user', 'liquidate', 'Should able to (or not) liquidate a loan.', mustFail), async function () {
            // encode current token price
            const encodeGetLatestAnswer = pairAggregatorEncoder.encodeGetLatestAnswer();
            await oracleInstance.givenMethodReturnUint(encodeGetLatestAnswer, oraclePrice.toString());

            // encode token decimals
            const encodeDecimals = erc20InterfaceEncoder.encodeDecimals();
            await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, tokenDecimals);

            // set up the loan information
            const currentTime = await getLatestTimestamp()
            const loanLength = Math.floor(loanDuration * ONE_DAY / 10000)
            let loanExpiry = currentTime - loanLength
            if (!loanExpired) {
                loanExpiry += ONE_HOUR
            }

            const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, loanCollateralRatio, 0, loanDuration)
            await instance.setLoan(mockLoanID, loanTerms, loanExpiry, 0, loanCollateral, 0, loanPrincipalOwed, loanInterestOwed, loanTerms.maxLoanAmount, ACTIVE, false)
            await instance.setTotalCollateral(totalCollateral)

            // give the contract collateral (mock has a fallback)
            await web3.eth.sendTransaction({ from: accounts[1], to: instance.address, value: totalCollateral });

            try {
                const contractBalBefore = await web3.eth.getBalance(instance.address)
                const liquidatorBefore = await web3.eth.getBalance(liquidator)

                let tx = await instance.liquidateLoan(mockLoanID, { from: liquidator })

                const totalAfter = await instance.totalCollateral.call()
                const contractBalAfter = await web3.eth.getBalance(instance.address)
                const liquidatorAfter = await web3.eth.getBalance(liquidator)

                let loan = await instance.loans.call(mockLoanID)

                assert.equal(parseInt(loan['collateral']), 0)
                assert.equal(totalCollateral.minus(loanCollateral).toFixed(), totalAfter.toString())
                assert.equal(BigNumber(contractBalBefore).minus(loanCollateral).toFixed(), contractBalAfter.toString())
                assert(parseInt(liquidatorBefore) < parseInt(liquidatorAfter))
                assert.equal(parseInt(loan['status']), CLOSED)
                assert.equal(loan['liquidated'], true)

            } catch (error) {
                if (!mustFail) console.log(error)
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});