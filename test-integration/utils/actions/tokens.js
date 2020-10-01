const { ETH_ADDRESS } = require('../../../test/utils/consts');

const getInfo = async ({token}) => {
  const decimalsPromise = token.decimals();
  const namePromise = token.name();
  const symbolPromise = token.symbol();

  const [decimals, name, symbol] = await Promise.all([
    decimalsPromise,
    namePromise,
    symbolPromise,
  ]);
  return {
    decimals,
    name,
    symbol,
    address: token.address,
  };
};

const getETH = async () => {
  return {
    decimals: async () => Promise.resolve(18),
    name: async () => Promise.resolve("ETH"),
    symbol: async () => Promise.resolve("ETH"),
    address: async () => Promise.resolve(ETH_ADDRESS),
  };
};

module.exports = {
  getInfo,
  getETH,
};
