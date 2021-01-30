import { DeployFunction } from 'hardhat-deploy/dist/types'
import envConfig from '../config'
import { EnvConfig } from '../test/types'
import { ChainlinkAggregator } from '../typechain'

const func: DeployFunction = async function ({ network, deployments: { get }, ethers }) {
  const env = envConfig(network.name) as EnvConfig

  const { tokens } = env.networkConfig

  const chainlinkAggregator_ProxyDeployment = await get('ChainlinkAggregator')
  const chainlinkAggregator = (await ethers.getContractAt(
    'ChainlinkAggregator',
    chainlinkAggregator_ProxyDeployment.address
  )) as ChainlinkAggregator

  for (const [_, { address, baseTokenName, quoteTokenName }] of Object.entries(env.networkConfig.chainlink)) {
    const baseTokenAddress = tokens[baseTokenName]
    const quoteTokenAddress = tokens[quoteTokenName]

    await chainlinkAggregator.add(baseTokenAddress, quoteTokenAddress, address)
  }
}
export default func
func.tags = ['test', 'live', 'chainlink-aggregator']
