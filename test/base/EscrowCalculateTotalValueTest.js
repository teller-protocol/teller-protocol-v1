// JS Libraries
const BN = require("bignumber.js");
const { withData } = require("leche");
const { t, ETH_ADDRESS } = require("../utils/consts");
const LoansBaseInterfaceEncoder = require("../utils/encoders/LoansBaseInterfaceEncoder");
const { encodeLoanParameter } = require("../utils/loans");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");
const USDC = artifacts.require("./mock/token/USDCMock.sol");
const LINK = artifacts.require("./mock/token/LINKMock.sol");

contract("EscrowCalculateTotalValueTest", function(accounts) {
  const loansEncoder = new LoansBaseInterfaceEncoder(web3)

  let instance;
  const loanedTokenIndex = 0;
  const tokens = [];
  const collateralAmount = 4000000;

  beforeEach(async () => {
    instance = await Escrow.new();
    tokens.push(
      await DAI.new(),
      await USDC.new()
    );
  });

  withData({
    _1_no_tokens_collateral_eth: [ true, collateralAmount, [], "0", "1234567890", false, null ],
    _2_with_tokens_dai_usdc_collateral_eth: [ true, collateralAmount, [ 0, 1 ], "10000000", "1234567890", false, null ],
    _3_with_tokens_dai_collateral_link: [ false, collateralAmount, [ 0 ], "10000000", "1234567890", false, null ]
  }, function test(
    collateralIsEth,
    collateralValueInEth,
    tokenIndices,
    tokensValueInEth,
    expectedValueInTokens,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "calculateTotalValue", "Should be able to calculate its total value of all assets owned.", mustFail), async function() {
      // Setup
      const loans = await Mock.new()
      await instance.mockLoans(loans.address)
      await loans.givenMethodReturnAddress(
        loansEncoder.encodeLendingToken(),
        tokens[loanedTokenIndex].address
      )
      await loans.givenMethodReturn(
        loansEncoder.encodeLoans(),
        encodeLoanParameter(web3, { collateral: collateralAmount })
      )

      let collateralAddress;
      if (collateralIsEth) {
        collateralAddress = ETH_ADDRESS;
      } else {
        const collateralToken = await LINK.new();
        collateralAddress = collateralToken.address;
      }
      await loans.givenMethodReturnAddress(
        loansEncoder.encodeCollateralToken(),
        collateralAddress
      )


      let expectedValueInEth = new BN(tokensValueInEth);

      await instance.mockValueOfIn(tokens[loanedTokenIndex].address, ETH_ADDRESS, tokensValueInEth);

      for (const index of tokenIndices) {
        const token = tokens[index];
        await instance.mockInitialToken(token.address);
        await instance.mockValueOfIn(token.address, ETH_ADDRESS, tokensValueInEth);
        expectedValueInEth = expectedValueInEth.plus(tokensValueInEth);
      }

      if (collateralIsEth) {
        expectedValueInEth = expectedValueInEth.plus(collateralAmount);
      } else {
        await instance.mockValueOfIn(collateralAddress, ETH_ADDRESS, collateralValueInEth);
        expectedValueInEth = expectedValueInEth.plus(collateralValueInEth);
      }

      await instance.mockValueOfIn(ETH_ADDRESS, tokens[loanedTokenIndex].address, expectedValueInTokens);

      let value;
      try {
        // Invocation
        value = await instance.calculateTotalValue.call();
      } catch (error) {
        assert.equal(error.reason, expectedErrorMessage);
        assert(mustFail);
      }

      // Assertions
      assert.equal(value.valueInEth.toString(), expectedValueInEth.toString(), "ETH value not calculated correctly.");
      assert.equal(value.valueInToken.toString(), expectedValueInTokens.toString(), "Token value not calculated correctly.");
    });
  });
});
