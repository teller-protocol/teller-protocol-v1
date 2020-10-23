const BN = require('bignumber.js')

const { NULL_ADDRESS } = require('../../../test/utils/consts')

async function setPrice(
  { chainlinkAggregator, token: baseToken, collateralToken: quoteToken },
  { testContext },
  { price }
  ) {
  const tokenSym = await baseToken.symbol();
  const collateralSym = await quoteToken.symbol()

  const { artifacts } = testContext
  const PairAggregatorMock = artifacts.require('PairAggregatorMock')
  const aggregatorFor = await chainlinkAggregator.aggregatorFor.call(baseToken.address, quoteToken.address)
  const chainlinkPairAggregatorAddress = aggregatorFor[0]
  if (chainlinkPairAggregatorAddress === NULL_ADDRESS) {
    throw new Error('Could not find Chainlink Aggregator address.')
  }

  const oracle = await PairAggregatorMock.at(chainlinkPairAggregatorAddress)
  const decimals = await oracle.decimals.call()
  const factor =new BN(10).pow(decimals.toString())
  const inverse = aggregatorFor[1]
  if (inverse) {
    price = new BN(1).dividedBy(price).times(factor).toFixed(0)
  } else {
    price = factor.times(price).toFixed(0)
  }

  console.log(`Setting ${tokenSym}/${collateralSym} oracle price: ${price}`);
  await oracle.setLatestAnswer(price);
}

module.exports = {
  setPrice
};
