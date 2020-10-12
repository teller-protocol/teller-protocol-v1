const BN = require('bignumber.js')

const { NULL_ADDRESS } = require('../../../test/utils/consts')

async function setPrice(
  { chainlinkAggregator, token, collateralToken },
  { testContext },
  { price }
  ) {
  const tokenSym = await token.symbol();
  const collateralSym = await collateralToken.symbol()

  const { artifacts } = testContext
  const PairAggregatorMock = artifacts.require('PairAggregatorMock')
  const aggregatorFor = await chainlinkAggregator.aggregatorFor.call(token.address, collateralToken.address)
  const chainlinkPairAggregatorAddress = aggregatorFor[0]
  if (chainlinkPairAggregatorAddress === NULL_ADDRESS) {
    throw new Error('Could not find Chainlink Aggregator address.')
  }

  const oracle = await PairAggregatorMock.at(chainlinkPairAggregatorAddress)
  const decimals = await oracle.decimals.call()
  const inverse = aggregatorFor[1]
  if (inverse) {
    price = new BN(10).pow(decimals.toString()).dividedBy(price).toFixed(0)
  } else {
    price = new BN(10).pow(decimals.toString()).times(price).toFixed(0)
  }

  console.log(`Setting ${tokenSym}/${collateralSym} oracle price: ${price}`);
  await oracle.setLatestAnswer(price);
}

module.exports = {
  setPrice
};
