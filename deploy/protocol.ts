import { DeployFunction } from 'hardhat-deploy/types'

const protocol: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, contracts, ethers, network } = hre
  const { deployer } = await getNamedAccounts()

  const tellerProtocol = await deployments.diamond.deploy('TellerProtocol_v1', {
    from: deployer,
    facets: ['ctx_AccessControl_v1'],
    deterministicSalt: '111',
    owner: deployer,
  })

  console.log(tellerProtocol.address)

  // const chainlinkAggregator = await deployments.save('PriceAggregator_v1', {
  // })
}

export default protocol
protocol.tags = ['protocol']
