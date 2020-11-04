const encodeAssetSettings = function(web3, { cTokenAddress, maxLoanAmount = 10000, initialized = true}) {
  return web3.eth.abi.encodeParameter({
    AssetSettings: {
      cTokenAddress: "address",
      maxLoanAmount: "uint256",
      initialized: "bool",
    }
  }, {
    cTokenAddress,
    maxLoanAmount,
    initialized,
  });
}

module.exports = {
  encodeAssetSettings,
}