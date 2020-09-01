// JS Libraries
const BN = require("bignumber.js");
const { withData } = require("leche");
const { t, ETH_ADDRESS,  } = require("../utils/consts");
const PairAggregatorEncoder = require("../utils/encoders/PairAggregatorEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");
const ERC20 = artifacts.require("./mock/token/ERC20Mock.sol")
const DAI = artifacts.require("./mock/token/DAIMock.sol");
const USDC = artifacts.require("./mock/token/USDCMock.sol");
const LINK = artifacts.require("./mock/token/LINKMock.sol");

contract("EscrowValueOfInTest", function(accounts) {
  const encoder = new PairAggregatorEncoder(web3)
  let instance;
  let assetsAddresses;
  let aggregator

  before(async () => {
    instance = await Escrow.new();
    aggregator = await Mock.new()
    await instance.mockGetAggregatorFor(aggregator.address)

    assetsAddresses = [
      ETH_ADDRESS,
      (await LINK.new()).address,
      (await DAI.new()).address,
      (await USDC.new()).address,
    ]
  });

  withData({
    ['_1_1_eth_in_dai']: [ 0, 2, '1', '400', false, null ],
    ['_2_3.5_eth_in_dai']: [ 0, 2, '3.5', '400', false, null ],
    ['_3_400_dai_in_eth']: [ 2, 0, '400', '0.0025', false, null ],
    ['_4_100_usdc_in_eth']: [ 3, 0, '100', '0.0025', false, null ],
    ['_5_3_link_in_dai']: [ 1, 2, '3', '123', false, null ],
  }, function(
    baseAssetIndex,
    quoteAssetIndex,
    baseAmount,
    price,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "_valueOfIn", "Should be able to calculate the value of a base asset in a quote asset.", mustFail), async function() {
      // Setup
      const baseAddress = assetsAddresses[baseAssetIndex]
      const quoteAddress = assetsAddresses[quoteAssetIndex]
      const baseDecimals = baseAddress === ETH_ADDRESS ? 18 : await (await ERC20.at(baseAddress)).decimals.call()
      const quoteDecimals = quoteAddress === ETH_ADDRESS ? 18 : await (await ERC20.at(quoteAddress)).decimals.call()
      price = new BN(price).multipliedBy(new BN(10).pow(quoteDecimals.toString())).toFixed()
      await aggregator.givenMethodReturnUint(
        encoder.encodeGetLatestAnswer(),
        price
      )

      const aWholeBase = new BN(10).pow(baseDecimals.toString())
      baseAmount = aWholeBase.multipliedBy(baseAmount).toFixed()
      const expectedValue = new BN(baseAmount).multipliedBy(price).dividedBy(aWholeBase)

      let value
      try {
        // Invocation
        value = await instance.externalValueOfIn.call(baseAddress, baseAmount, quoteAddress)
      } catch (error) {
        assert.equal(error.message, expectedErrorMessage);
        assert(mustFail);
      }

      // Assertions
      assert.equal(value.toString(), expectedValue.toFixed(), 'Values do not match')
    });
  });
});
