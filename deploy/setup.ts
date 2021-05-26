import { DeployFunction } from 'hardhat-deploy/types'

const deployNFT: DeployFunction = async (hre) => {
  const { network, run } = hre

  if (!network.live) {
    // Fund the deployer account on forked network if needed
    await run('fork:fund-deployer')
  }
}

deployNFT.tags = ['setup']

export default deployNFT
