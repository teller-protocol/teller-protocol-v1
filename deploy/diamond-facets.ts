import { DeployFunction } from 'hardhat-deploy/types'

const protocol: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, contracts, ethers, network } = hre
  const { deployer } = await getNamedAccounts()

  await deployments.deterministic('OwnersihpFacet_v1', {
    from: deployer,
    contract: 'OwnershipFacet_v1',
  })
}

export default protocol
protocol.tags = ['protocol']
