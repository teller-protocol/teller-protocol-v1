const setPrice = async function setPrice({ oracle }, {}, {price}) {
  console.log(`Settings oracle price: ${price}`);
  const setLatestAnswerResult = await oracle.setLatestAnswer(price);
  return setLatestAnswerResult;
};

module.exports = {
  setPrice,
};
