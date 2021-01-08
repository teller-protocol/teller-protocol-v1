// JS Libraries
const { withData } = require("leche");
const { t } = require("../utils/consts");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LendingPool = artifacts.require("LendingPoolMock.sol");

contract("LendingPoolGetSupplyToDebtForTest", function(accounts) {
  let instance;

  beforeEach("Setup for each test", async () => {
    instance = await LendingPool.new();
    await instance.initialize(
      (await Mock.new()).address,
      (await Mock.new()).address,
      (await Mock.new()).address,
      (await Mock.new()).address,
      (await Mock.new()).address
    );
  });

  withData({
    // (500 borrow - 100 repay + 500 newLoanAmount) / 2000 Supply = 0.45
    _1_scenario: {
      marketState: {
        totalSupplied: 2000,
        totalRepaid: 100,
        totalBorrowed: 500
      },
      newLoanAmount: 500,
      expectedDebtRatio: 4500
    },
    // (2000 borrow - 1000 repay + 700 newLoanAmount) / 2000 Supply = 0.85
    _2_scenario: {
      marketState: {
        totalSupplied: 2000,
        totalRepaid: 1000,
        totalBorrowed: 2000
      },
      newLoanAmount: 700,
      expectedDebtRatio: 8500
    },
    // (2500 borrow - 0 repay + 500 newLoanAmount) / 2500 Supply = 1.2
    _3_scenario: {
      marketState: {
        totalSupplied: 2500,
        totalRepaid: 0,
        totalBorrowed: 2500
      },
      newLoanAmount: 500,
      expectedDebtRatio: 12000
    },
    // (0 borrow - 0 repay + 1000 newLoanAmount) / 1000 Supply = 1
    _4_scenario: {
      marketState: {
        totalSupplied: 1000,
        totalRepaid: 0,
        totalBorrowed: 0
      },
      newLoanAmount: 1000,
      expectedDebtRatio: 10000
    },
    // (0 borrow - 0 repay + 2000 newLoanAmount) / 0 Supply = 0
    _5_scenario: {
      marketState: {
        totalSupplied: 0,
        totalRepaid: 0,
        totalBorrowed: 0
      },
      newLoanAmount: 2000,
      expectedDebtRatio: 0
    },
    // (2000 borrow - 2040 repay + 0 newLoanAmount) / 2500 Supply = 0
    _6_scenario: {
      marketState: {
        totalSupplied: 2500,
        totalRepaid: 2040,
        totalBorrowed: 2000
      },
      newLoanAmount: 0,
      expectedDebtRatio: 0
    }
  }, function({ marketState, newLoanAmount, expectedDebtRatio }) {
    it(t("user", "getSupplyToDebtFor", "Should be able to get the supply to debt value.", false), async function() {
      // Setup
      await instance.mockMarketState(marketState.totalSupplied, marketState.totalRepaid, marketState.totalBorrowed);

      // Invocation
      const result = await instance.getSupplyToDebtFor(newLoanAmount);

      // Assertions
      assert.equal(result.toString(), expectedDebtRatio.toString());

    });
  });
});
