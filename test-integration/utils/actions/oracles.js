const {toUnits, toDecimals} = require("../../../test/utils/consts");

const setPrice = async ({oracle, token}, {txConfig, testContext}, {price}) => {
  const tokenSymbol = await token.symbol();
  const priceUnits = toUnits(price, 18);
  const inversePrice = 1 / priceUnits;
  console.log(
    `Settings oracle price: 1 ${tokenSymbol} = ${priceUnits} ETH or 1 ETH = ${inversePrice} ${tokenSymbol}`
  );
  const setLatestAnswerResult = await oracle.setLatestAnswer(price);

  return setLatestAnswerResult;
};

module.exports = {
  setPrice,
};
