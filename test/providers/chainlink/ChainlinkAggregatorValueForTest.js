// JS Libraries
const BN = require('bignumber.js');

const ERC20InterfaceEncoder = require('../../utils/encoders/ERC20InterfaceEncoder');
const AggregatorV2V3InterfaceEncoder = require('../../utils/encoders/AggregatorV2V3InterfaceEncoder');
const { createTestSettingsInstance } = require('../../utils/settings-helper');
const { toDecimals } = require('../../utils/consts');
const withData = require('leche').withData;
const { t } = require('../../utils/consts');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');
const ChainlinkAggregator = artifacts.require(
  './providers/chainlink/ChainlinkAggregator.sol'
);

// Smart contracts
const Settings = artifacts.require('./base/Settings.sol');

contract('ChainlinkAggregatorValueForTest', function (accounts) {
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
  };

  withData(
    {
      _1_eth_dai_oracle: [100, 18, 18, 1.2, 18, false, null],
      _2_eth_usd_oracle: [100, 18, 18, 1.2, 8, false, null],
    },
    function (
      borrowedAmount,
      borrowedTokenDecimals,
      collateralTokenDecimals,
      chainlinkResponsePrice,
      chainlinkResponseDecimals,
      mustFail,
      expectedErrorMessage
    ) {
      it(
        t(
          'loans',
          'latestAnswerFor',
          'Should be able (or not) to get the latest answer for a market.',
          mustFail
        ),
        async function () {
          try {
            const borrowedToken = await mockERC20(
              { decimals: borrowedTokenDecimals },
              { Mock, encoder: erc20InterfaceEncoder }
            );
            const collateralToken = await mockERC20(
              { decimals: collateralTokenDecimals },
              { Mock, encoder: erc20InterfaceEncoder }
            );
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
              borrowedToken.address,
              collateralToken.address,
              chainlinkAggregator.address
            );
            const borrowedAmountWithDecimals = toDecimals(
              borrowedAmount,
              borrowedTokenDecimals
            );

            // Invocation
            const valueForResult = await instance.valueFor(
              borrowedToken.address,
              collateralToken.address,
              borrowedAmountWithDecimals.toFixed(0)
            );

            // Assertions
            const aggregatorForResult = await instance.aggregatorFor(
              borrowedToken.address,
              collateralToken.address
            );

            const expectedLatestAnswer = toDecimals(
              new BN(borrowedAmount).multipliedBy(chainlinkResponsePrice),
              collateralTokenDecimals
            );
            assert.equal(valueForResult.toString(), expectedLatestAnswer.toString());
            assert(!mustFail);
          } catch (error) {
            assert(mustFail, error.message);
            assert.equal(error.reason, expectedErrorMessage, error.message);
          }
        }
      );
    }
  );

  withData(
    {
      _1_link_dai_eth_oracle: [100, 18, 18, 1.2, 18, false, null],
      _2_eth_link_usd_oracle: [100, 18, 8, 1.2, 8, false, null],
    },
    function (
      borrowedAmount,
      borrowedTokenDecimals,
      collateralTokenDecimals,
      chainlinkResponsePrice,
      chainlinkResponseDecimals,
      mustFail,
      expectedErrorMessage
    ) {
      it(
        t(
          'loans',
          'latestAnswerFor',
          'Should be able (or not) to get the latest answer for a market.',
          mustFail
        ),
        async function () {
          try {
            const borrowedToken = await mockERC20(
              { decimals: borrowedTokenDecimals },
              { Mock, encoder: erc20InterfaceEncoder }
            );
            const routeToken = await mockERC20(
              { decimals: collateralTokenDecimals },
              { Mock, encoder: erc20InterfaceEncoder }
            );
            const collateralToken = await mockERC20(
              { decimals: collateralTokenDecimals },
              { Mock, encoder: erc20InterfaceEncoder }
            );
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
              borrowedToken.address,
              routeToken.address,
              chainlinkAggregator.address
            );

            await instance.add(
              routeToken.address,
              collateralToken.address,
              chainlinkAggregator.address
            );

            const borrowedAmountWithDecimals = toDecimals(
              borrowedAmount,
              borrowedTokenDecimals
            );

            // Invocation
            const valueForResult = await instance.valueFor(
              borrowedToken.address,
              collateralToken.address,
              borrowedAmountWithDecimals.toFixed(0)
            );

            // Assertions
            const aggregatorForResult = await instance.aggregatorFor(
              borrowedToken.address,
              collateralToken.address
            );

            const expectedLatestAnswer = toDecimals(
              new BN(borrowedAmount)
                .multipliedBy(chainlinkResponsePrice)
                .multipliedBy(chainlinkResponsePrice),
              collateralTokenDecimals
            );
            assert.equal(valueForResult.toString(), expectedLatestAnswer.toString());
            assert(!mustFail);
          } catch (error) {
            assert(mustFail, error.message);
            assert.equal(error.reason, expectedErrorMessage, error.message);
          }
        }
      );
    }
  );
});
