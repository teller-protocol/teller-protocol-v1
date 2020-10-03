const { NULL_ADDRESS, ACTIVE } = require("./consts");

exports.encodeDappConfigParameter = (web3, {
  exists = true,
  unsecured = true
}) => {
  return web3.eth.abi.encodeParameter({
    Dapp: {
      exists: "bool",
      unsecrude: "bool"
    }
  }, {
    exists,
    unsecured
  });
};
