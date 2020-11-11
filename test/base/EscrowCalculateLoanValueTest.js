// JS Libraries
const { withData } = require("leche");
const { t, ETH_ADDRESS, } = require("../utils/consts");
const LoansBaseInterfaceEncoder = require("../utils/encoders/LoansBaseInterfaceEncoder");
const { createMocks } = require("../utils/consts");
const { createTestSettingsInstance } = require("../utils/settings-helper");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DAIMock = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");
const LoansBase = artifacts.require('./base/LoansBase.sol')

contract("EscrowCalculateLoanValueTest", function(accounts) {
  const loansEncoder = new LoansBaseInterfaceEncoder(web3);

  let instance;

  beforeEach(async () => {
    const settings = await createTestSettingsInstance(Settings, { from: accounts[0], Mock });

    instance = await Escrow.new();
    await instance.externalSetSettings(settings.address);
  });

  withData({
    _1_1_token: [ [ { isToken: true, amount: 1000 } ], 1000 ],
    _2_1_token_and_eth: [ [ { isToken: true, amount: 1000 }, { isToken: false, amount: 2000 } ], 3000 ],
    _3_3_tokens: [ [ { isToken: true, amount: 1000 }, { isToken: true, amount: 2000 }, { isToken: true, amount: 3000 } ], 6000 ],
    _4_3_tokens_and_eth: [ [ { isToken: true, amount: 1000 }, { isToken: true, amount: 2000 }, { isToken: true, amount: 3000 }, { isToken: false, amount: 4000 } ], 10000 ],
  }, function(
    tokenAmounts,
    expectedValue
  ) {
    it(t("escrow", "calculateLoanValue", "Should be able to calculate its total value of all assets owned.", false), async function() {
      const tokensAddresses = await createMocks(DAIMock, tokenAmounts.length);
      const lendingAddress = tokensAddresses[0];

      const loans = await Mock.new();
      await loans.givenMethodReturnAddress(
        loansEncoder.encodeLendingToken(),
        lendingAddress
      );

      await instance.externalSetTokens(tokensAddresses);
      await instance.mockLoans(loans.address);

      for (let i = 0; i < tokensAddresses.length; i++) {
        const { isToken, amount } = tokenAmounts[i]
        if (isToken) {
          await instance.mockValueOfIn(tokensAddresses[i], ETH_ADDRESS, amount);
        } else {
          const ethToken = await DAIMock.at(tokensAddresses[i])
          await ethToken.mint(instance.address, amount)
        }
      }

      await instance.mockValueOfIn(ETH_ADDRESS, lendingAddress, expectedValue);

      // Invocation
      const value = await instance.calculateLoanValue.call();

      // Assertions
      assert.equal(value.toString(), expectedValue.toString());
    });
  });
});
