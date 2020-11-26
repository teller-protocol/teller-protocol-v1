// JS Libraries
const withData = require('leche').withData;

const { t, NULL_ADDRESS, ACTIVE } = require('../utils/consts');
const { loans } = require('../utils/events');
const { createLoanTerms } = require('../utils/structs');
const { createTestSettingsInstance } = require('../utils/settings-helper');
const { createLoan } = require('../utils/loans');

const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const ChainlinkAggregatorEncoder = require('../utils/encoders/ChainlinkAggregatorEncoder');
const LendingPoolInterfaceEncoder = require('../utils/encoders/LendingPoolInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");

// Libraries
const LoanLib = artifacts.require("../util/LoanLib.sol");

contract('LoansBaseWithdrawCollateralTest', function (accounts) {
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const chainlinkAggregatorEncoder = new ChainlinkAggregatorEncoder(web3);
    const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);

    let instance;
    let chainlinkAggregatorInstance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let lendingTokenInstance;
    let settingsInstance;
    let collateralTokenInstance;

    const mockLoanID = 7
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        lendingTokenInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();

        settingsInstance = await createTestSettingsInstance(
          Settings,
          {
              Mock,
              initialize: true,
              onInitialize: async (instance, { chainlinkAggregator }) => {
                  chainlinkAggregatorInstance = chainlinkAggregator
              },
          });

        collateralTokenInstance = await Mock.new();
        const loanLib = await LoanLib.new();
        await Loans.link("LoanLib", loanLib.address);
        instance = await Loans.new();
        await instance.initialize(
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            collateralTokenInstance.address,
        )

        // encode lending token address
        const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken();
        await lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address);
    });

    withData({
        _1_non_borrower: [accounts[1], 0, 0, 0, 0, 0, 0, 0, accounts[2], 0, true, 'CALLER_DOESNT_OWN_LOAN'],
        _2_withdraw_zero: [accounts[1], 0, 0, 0, 0, 0, 0, 0, accounts[1], 0, true, 'CANNOT_WITHDRAW_ZERO'],
        _3_more_than_allowed: [accounts[1], 10000000, 2564000, 5410, 40000, 18, 65432, 35000, accounts[1], 10000, true, 'COLLATERAL_AMOUNT_TOO_HIGH'],
        _4_less_than_allowed: [accounts[1], 10000000, 2564000, 5410, 40000, 18, 65432, 20000, accounts[1], 1000, false, undefined],
        _5_none_allowed: [accounts[1], 10000000, 2564000, 5410, 40000, 18, 65432, 40000, accounts[1], 1000, true, 'COLLATERAL_AMOUNT_TOO_HIGH'],
    }, function(
        loanBorrower,
        loanPrincipalOwed,
        loanInterestOwed,
        loanCollateralRatio,
        loanCollateral,
        tokenDecimals,
        totalCollateral,
        oracleValue,
        msgSender,
        withdrawalAmount,
        mustFail,
        expectedErrorMessage
    ) {
        it(t('user', 'withdrawCollateral', 'Should able to withdraw collateral.', false), async function() {
            // Setup
            const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, loanCollateralRatio, 0, 0);

            const loan = createLoan({ id: mockLoanID, loanTerms, collateral: loanCollateral, principalOwed: loanPrincipalOwed, interestOwed: loanInterestOwed, borrowedAmount: loanTerms.maxLoanAmount, status: ACTIVE, liquidated: false});

            await instance.setLoan(loan);
            
            // mock get collateral needed info
            await instance.mockGetCollateralInfo(mockLoanID, loanPrincipalOwed, oracleValue)

            // encode token decimals
            const encodeDecimals = erc20InterfaceEncoder.encodeDecimals();
            await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, tokenDecimals);
            try {
                const contractBalBefore = await web3.eth.getBalance(instance.address)
                const tx = await instance.withdrawCollateral(withdrawalAmount, mockLoanID, { from: msgSender })
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(tx);
                const totalAfter = await instance.totalCollateral.call()
                const contractBalAfter = await web3.eth.getBalance(instance.address)

                const withdrawalAllowed = loanCollateral - oracleValue
                const paidOut = Math.min(withdrawalAllowed, withdrawalAmount)

                let loan = await instance.loans.call(mockLoanID)

                const wasCollateralPaidOut = await instance.paidOutCollateral.call();

                loans
                    .collateralWithdrawn(tx)
                    .emitted(mockLoanID, loanBorrower, paidOut)

                assert(wasCollateralPaidOut, 'Expected payOutCollateral to be called');
            } catch (error) {
                assert(mustFail, error.message);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});