import { DeployFunction } from 'hardhat-deploy/types'

const phillip: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, contracts, ethers, network } = hre
  const { deployer } = await getNamedAccounts()

  const tellerProtocol = await deployments.diamond.deploy('Phillip', {
    from: deployer,
    deterministicSalt: '111',
    facets: ['ctx_AccessControl_v2'],
    execute: {
      methodName: 'initialize',
      args: ['message'],
    },
  })

  console.log(tellerProtocol.address)

  // const chainlinkAggregator = await deployments.save('PriceAggregator_v1', {
  // })
}

export default phillip
phillip.tags = ['phillip']
