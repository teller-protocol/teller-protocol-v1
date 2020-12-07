// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS, ACTIVE, ONE_DAY } = require("../utils/consts");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { createLoanTerms } = require("../utils/structs");
const { createLoan, createLiquidationInfo } = require("../utils/loans");
const Timer = require("../../scripts/utils/Timer");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

// Libraries
const LoanLib = artifacts.require("../util/LoanLib.sol");

contract("LoansBasePayOutLiquidatorTest", function(accounts) {
    const timer = new Timer(web3);
    let instance;
    const mockLoanID = 3817;

    beforeEach("Setup for each test", async () => {
        settingsInstance = await createTestSettingsInstance(Settings, {
            Mock,
            from: accounts[0],
            initialize: true,
        });
        const loanLib = await LoanLib.new();
        await Loans.link("LoanLib", loanLib.address);
        instance = await Loans.new();
        await instance.initialize(
            (await Mock.new()).address,
            (await Mock.new()).address,
            settingsInstance.address,
            (await Mock.new()).address,
        );
    });

    withData({
        _1_basic_liquidated: [{
            loanBorrower: accounts[1],
            liquidator: accounts[2],
            loanCollateralRatio: 5410,
            loanCollateral: 10000,
            principalOwed: 15000,
            interestOwed: 300,
            status: ACTIVE,
            valueInLendingTokens: 15300,
            escrowLoanValue: 7000,
            neededInCollateralTokens: 410,
            neededInLendingTokens: 7000,
            moreCollateralRequired: true,
            amountToLiquidate: 14000,
            rewardInCollateral: 1000,
            liquidable: true,
            mustFail: false,
            expectedErrorMessage: null
        }],
        _2_not_liquidated: [{
            loanBorrower: accounts[1],
            liquidator: accounts[2],
            loanCollateralRatio: 3231,
            loanCollateral: 12000,
            principalOwed: 10000,
            interestOwed: 200,
            status: ACTIVE,
            valueInLendingTokens: 12200,
            escrowLoanValue: 6000,
            neededInCollateralTokens: 210,
            neededInLendingTokens: 6000,
            moreCollateralRequired: false,
            amountToLiquidate: 11000,
            rewardInCollateral: 800,
            liquidable: true,
            mustFail: true,
            expectedErrorMessage: null
        }],
    }, function({
        loanBorrower,
        liquidator,
        loanCollateralRatio,
        loanCollateral,
        principalOwed,
        interestOwed,
        status,
        valueInLendingTokens,
        escrowLoanValue,
        neededInLendingTokens,
        neededInCollateralTokens,
        moreCollateralRequired,
        amountToLiquidate,
        rewardInCollateral,
        liquidable,
        mustFail,
        expectedErrorMessage
    }) {
        it(t("loans", "payOutLiquidator", "Should be able to (or not) pay out to a liquidator.", mustFail), async function() {
            
            // set up loan
            const currentTimestampSeconds = await timer.getCurrentTimestampInSeconds();
            let loanLength = Math.floor(30 * ONE_DAY);
            const loanStartTime = currentTimestampSeconds - loanLength;

            const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, loanCollateralRatio, 0, loanLength);

            const loan = createLoan({ id: mockLoanID, loanTerms, loanStartTime, principalOwed, interestOwed, borrowedAmount: loanTerms.maxLoanAmount, status });


            // Mock liquidation info
            const liquidationInfo = createLiquidationInfo({
                collateralInfo: {
                    collateral: loanCollateral,
                    valueInLendingTokens,
                    escrowLoanValue,
                    neededInLendingTokens,
                    neededInCollateralTokens,
                    moreCollateralRequired
                },
                amountToLiquidate,
                rewardInCollateral,
                liquidable,
            });

            await instance.setLoan(loan);
            await instance.mockLiquidationInfo(liquidationInfo);

            try {
                const result = await instance.externalPayOutLiquidator(mockLoanID, liquidationInfo, liquidator);
                const afterPayOut = await instance.paidOutCollateral();
                assert(result);
                assert(afterPayOut, "Liquidator not paid");
            } catch (error) {
                assert(mustFail, error.message);
                assert.equal(error.message, expectedErrorMessage, error.message);
            }            
        }) 
    })
})