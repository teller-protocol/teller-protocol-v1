class Uniswap {
  constructor(web3, deployedArtifact, wethAddress, routerAddress) {
    this.web3 = web3
    this.artifact = deployedArtifact
    this.wethAddress = wethAddress
    this.routerAddress = routerAddress
  }

  static async init(web3, deployedArtifact, wethAddress, routerAddress, funderTxConfig) {
    const uniswap = new Uniswap(web3, deployedArtifact, wethAddress, routerAddress)

    // fund contract with 500 ETH
    await web3.eth.sendTransaction({ from: funderTxConfig.from, to: deployedArtifact.address, value: '500000000000000000000' })

    return uniswap
  }

  async swapForExact(path, destinationAmount, senderTxConfig) {
    return this.artifact.swapForExact(
      this.wethAddress,
      this.routerAddress,
      path,
      destinationAmount,
      senderTxConfig
    )
  }
}

module.exports = Uniswap