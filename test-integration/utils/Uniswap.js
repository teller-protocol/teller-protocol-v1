class Uniswap {
  constructor(web3, deployedArtifact) {
    this.web3 = web3
    this.artifact = deployedArtifact
  }

  static async init(web3, deployedArtifact, funderTxConfig) {
    const uniswap = new Uniswap(web3, deployedArtifact)

    // fund contract with 500 ETH
    await web3.eth.sendTransaction({ from: funderTxConfig.from, to: deployedArtifact.address, value: '500000000000000000000' })

    return uniswap
  }

  async swapForExact(path, destinationAmount, senderTxConfig) {
    return this.artifact.swapForExact(
      path,
      destinationAmount,
      senderTxConfig
    )
  }
}

module.exports = Uniswap