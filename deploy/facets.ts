import { artifacts } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'

const facets: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, contracts, ethers, network } = hre
  const { deployer } = await getNamedAccounts()

  await deployments.deterministic('OwnershipFacet_v1', {
    from: deployer,
    salt: process.env.SALT,
    contract: artifacts.
  })

  const tellerProtocol = await deployments.deploy('TellerProtocol_v1', {
    from: deployer,
  })

  // const chainlinkAggregator = await deployments.save('PriceAggregator_v1', {
  // })
}

export default facets
facets.tags = ['facets']
