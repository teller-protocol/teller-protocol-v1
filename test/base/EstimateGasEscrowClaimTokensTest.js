// JS Libraries
const BN = require("bignumber.js");
const { withData } = require("leche");
const { t, ETH_ADDRESS } = require("../utils/consts");
const ILoansBaseEncoder = require("../utils/encoders/LoansBaseEncoder");
const { Closed } = require('../utils/loanStatus')
const { createMocks } = require("../utils/consts");
const { encodeLoanParameter } = require("../utils/loans");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DAIMock = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");

contract("EstimateGasEscrowClaimTokensTest", function(accounts) {
  const loansEncoder = new ILoansBaseEncoder(web3);
  
  const baseGasCost = 453493; // Gas cost with 1 token in wallet
  const expectedGasCost = (tokens) => baseGasCost + ((tokens -  1) * 168000); // Gas cost > 1 token in wallet

  let instance;
  let loans;
  let borrower = accounts[2];

  beforeEach(async () => {
    instance = await Escrow.new();
    loans = await Mock.new();
    await instance.mockInitialize(loans.address, 0, { from: borrower });
    await instance.mockLoans(loans.address);
  });

  withData({
    _1_1_token: [ 1 ],
    _2_2_tokens: [ 2 ],
    _3_3_tokens: [ 3 ],
    _4_4_tokens: [ 4 ],
    _5_5_tokens: [ 5 ],
    _6_6_tokens: [ 6 ],
    _7_7_tokens: [ 7 ],
    _8_8_tokens: [ 8 ],
    _9_9_tokens: [ 9 ],
    _10_10_tokens: [ 10 ],
  }, function(
    tokenCount,
  ) {
    it(t("escrow", "claimTokens", "Should be able to claim all tokens in the escrow", false), async function() {
      await loans.givenMethodReturn(
        loansEncoder.encodeLoans(),
        encodeLoanParameter(web3, { status: Closed, liquidated: true, loanTerms: { borrower } })
      );
      
      const tokensAddresses = await createMocks(DAIMock, tokenCount);
      await instance.externalSetTokens(tokensAddresses);
      const expectedMaxGas = expectedGasCost(tokenCount);

      for (let i = 0; i < tokensAddresses.length; i++) {
        const token = await DAIMock.at(tokensAddresses[i])
        await token.mint(instance.address, 100000)
      }

      // Invocation
      const result = await instance.claimTokens.estimateGas({ from: borrower });
      
      // Assertions
      assert(parseInt(result) <= expectedMaxGas, 'Gas usage exceeded network gas limit.');
    });
  });
});
