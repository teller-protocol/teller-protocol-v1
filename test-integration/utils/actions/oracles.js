const {toUnits, toDecimals} = require("../../../test/utils/consts");

const setPrice = async ({ oracle }, {}, {price}) => {
  console.log(`Settings oracle price: ${price}`);
  const setLatestAnswerResult = await oracle.setLatestAnswer(price);
  return setLatestAnswerResult;
};

module.exports = {
  setPrice,
};
