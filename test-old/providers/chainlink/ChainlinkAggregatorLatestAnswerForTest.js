// JS Libraries
const ERC20InterfaceEncoder = require("../../utils/encoders/ERC20InterfaceEncoder");
const AggregatorV2V3InterfaceEncoder = require("../../utils/encoders/AggregatorV2V3InterfaceEncoder");
const { createTestSettingsInstance } = require("../../utils/settings-helper");
const { toDecimals } = require("../../utils/consts");
const withData = require("leche").withData;
const { t } = require("../../utils/consts");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const ChainlinkAggregator = artifacts.require("./providers/chainlink/ChainlinkAggregator.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract("ChainlinkAggregatorLatestAnswerForTest", function(accounts) {
  const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
  const aggregatorV2V3InterfaceEncoder = new AggregatorV2V3InterfaceEncoder(web3);

  const owner = accounts[0];

  let instance;
  let settings;

  beforeEach(async () => {
    settings = await createTestSettingsInstance(Settings, { from: owner, Mock });
    
    instance = await ChainlinkAggregator.new();
    await instance.initialize(settings.address);
  });

  const mockERC20 = async ({ decimals }, { Mock, encoder }) => {
    const token = await Mock.new();
    await token.givenMethodReturnUint(encoder.encodeDecimals(), decimals);
    return token;
  }


  withData({
    _1_eth_dai_oracle: [ 18, 18, 1.2, 18, toDecimals(1.2, 18), false, null ],
    _2_eth_usd_oracle: [ 18, 18, 1.2, 8, toDecimals(1.2, 18), false, null ],
    _3_usdc_eth_oracle: [ 6, 18, 1.2, 18, toDecimals(1.2, 18), false, null ],
  }, function(
    lendingTokenDecimals,
    collateralTokenDecimals,
    chainlinkResponsePrice,
    chainlinkResponseDecimals,
    expectedLatestAnswer,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("loans", "latestAnswerFor", "Should be able (or not) to get the latest answer for a market.", mustFail), async function() {
      try {
        const lendingToken = await mockERC20({ decimals: lendingTokenDecimals }, { Mock, encoder: erc20InterfaceEncoder });
        const collateralToken = await mockERC20({ decimals: collateralTokenDecimals }, { Mock, encoder: erc20InterfaceEncoder });
        const chainlinkAggregator = await Mock.new();
        await chainlinkAggregator.givenMethodReturnUint(
          aggregatorV2V3InterfaceEncoder.encodeLatestAnswer(),
          toDecimals(chainlinkResponsePrice, chainlinkResponseDecimals)
        );
        await chainlinkAggregator.givenMethodReturnUint(
          aggregatorV2V3InterfaceEncoder.encodeDecimals(),
          chainlinkResponseDecimals
        );

        await instance.add(
          lendingToken.address,
          collateralToken.address,
          chainlinkAggregator.address
        );

        // Invocation
        const latestPriceForResult = await instance.latestAnswerFor(
          lendingToken.address,
          collateralToken.address,
        );


        // Assertions
        const aggregatorForResult = await instance.aggregatorFor(
          lendingToken.address,
          collateralToken.address,
        );

        assert.equal(latestPriceForResult.toString(), expectedLatestAnswer.toString());
        assert(!mustFail);
      } catch (error) {
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage, error.message);
      }
    });
  });
});
