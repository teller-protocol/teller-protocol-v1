const BigNumber = require("bignumber.js");

// Util classes
const { printPairAggregator } = require('../../test/utils/printer')
const {
  chainlink: chainlinkActions,
  tokens: tokenActions,
} = require("../utils/actions");
const { teller, tokens } = require("../utils/contracts");
const { ganache: readParams } = require("../utils/cli-builder");
const { BASE_TOKEN_NAME, QUOTE_TOKEN_NAME, NEW_VALUE } = require("../utils/cli/names");
const ProcessArgs = require("../utils/ProcessArgs");
const processArgs = new ProcessArgs(readParams.setOraclePrice().argv);

module.exports = async (callback) => {
  try {
    const baseTokenName = processArgs.getValue(BASE_TOKEN_NAME.name);
    const quoteTokenName = processArgs.getValue(QUOTE_TOKEN_NAME.name);
    const newValue = processArgs.getValue(NEW_VALUE.name);

    const getContracts = processArgs.createGetContracts(artifacts);
    const chainlinkAggregator = await getContracts.getDeployed(teller.chainlinkAggregator());
    const baseToken = await getContracts.getTokenDeployed({ tokens }, baseTokenName);
    const quoteToken = await getContracts.getTokenDeployed({ tokens }, quoteTokenName);

    const baseTokenInfo = await tokenActions.getInfo({ token: baseToken })
    const quoteTokenInfo = await tokenActions.getInfo({ token: quoteToken })

    console.log();
    console.log("Current Price:");
    await printPairAggregator(
      { chainlinkAggregator },
      { tokenInfo: baseTokenInfo, collateralTokenInfo: quoteTokenInfo }
    )

    await chainlinkActions.setPrice(
      { chainlinkAggregator, token: baseToken, collateralToken: quoteToken },
      { testContext: { artifacts } },
      { price: newValue }
    );

    console.log();
    console.log("New Price:");
    await printPairAggregator(
      { chainlinkAggregator },
      { tokenInfo: baseTokenInfo, collateralTokenInfo: quoteTokenInfo }
    )

    console.log(">>>> The script finished successfully. <<<<");
    callback();
  } catch (error) {
    console.log(error);
    callback(error);
  }
};