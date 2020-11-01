const { ETH_ADDRESS } = require('../../../test/utils/consts');

const getInfo = async ({token}) => {
  const name = await token.name();
  if (name.toLowerCase() === 'eth') {
    return getETH()
  }

  const decimalsPromise = token.decimals();
  const symbolPromise = token.symbol();

  const [decimals, symbol] = await Promise.all([
    decimalsPromise,
    symbolPromise,
  ]);
  return {
    decimals: decimals.toString(),
    name,
    symbol,
    address: token.address,
  };
};

const getETH = () => {
  return {
    decimals: "18",
    name: "ETH",
    symbol: "ETH",
    address: ETH_ADDRESS,
  };
};

module.exports = {
  getInfo,
  getETH,
};
