const encodeAssetSettings = function(web3, { cTokenAddress, maxLoanAmount = 10000}) {
  return web3.eth.abi.encodeParameter({
    AssetSettings: {
      cTokenAddress: "address",
      maxLoanAmount: "uint256"
    }
  }, {
    cTokenAddress,
    maxLoanAmount
  });
}

module.exports = {
  encodeAssetSettings,
}