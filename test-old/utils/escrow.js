exports.encodeDappConfigParameter = (web3, {
  exists = true,
  unsecured = true
}) => {
  return web3.eth.abi.encodeParameter({
    Dapp: {
      exists: "bool",
      unsecured: "bool"
    }
  }, {
    exists,
    unsecured
  });
};
