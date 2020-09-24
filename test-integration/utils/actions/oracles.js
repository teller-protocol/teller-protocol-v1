const {toUnits} = require("../../../test/utils/consts");

const setPrice = async ({oracle, token}, {txConfig, testContext}, {price}) => {
  const tokenSymbol = await token.symbol();
  console.log(
    `Settings oracle price: 1 ${tokenSymbol} = ${price.toFixed(
      0
    )} WEI = ${toUnits(price, 18)} ETHER`
  );
  const setLatestAnswerResult = await oracle.setLatestAnswer(price);

  return setLatestAnswerResult;
};

module.exports = {
  setPrice,
};
