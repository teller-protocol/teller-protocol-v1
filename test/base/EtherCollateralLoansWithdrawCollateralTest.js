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
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");

contract('EtherCollateralLoansWithdrawCollateralTest', function (accounts) {
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
            
            await instance.setTotalCollateral(totalCollateral)
            const totalBefore = await instance.totalCollateral.call()
            assert.equal(totalCollateral.toString(), totalBefore.toString(), 'collateral not set')

            // give the contract collateral through a deposit (mock has a fallback)
            await web3.eth.sendTransaction({ from: accounts[1], to: instance.address, value: totalCollateral });

            // encode current token price
            await chainlinkAggregatorInstance.givenMethodReturnUint(
              chainlinkAggregatorEncoder.encodeValueFor(),
              oracleValue.toString()
            );

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

                loans
                    .collateralWithdrawn(tx)
                    .emitted(mockLoanID, loanBorrower, paidOut)

                assert.equal(parseInt(loan.collateral), (loanCollateral - paidOut))
                assert.equal(totalCollateral - paidOut, parseInt(totalAfter))
                assert.equal(parseInt(contractBalBefore) - paidOut, parseInt(contractBalAfter))
            } catch (error) {
                assert(mustFail, error.message);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});