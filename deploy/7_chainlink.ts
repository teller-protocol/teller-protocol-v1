import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getTokens } from '../config/tokens'
import { getChainlink } from '../config/chainlink'
import { Network } from '../types/custom/config-types'

const addChainlinkPairs: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, network } = hre
  const { deployer } = await getNamedAccounts()

  const tokens = getTokens(<Network>network.name)
  const chainlink = getChainlink(<Network>network.name)

  for (const chainlinkPair of Object.values(chainlink)) {
    const { address, baseTokenName, quoteTokenName } = chainlinkPair
    await deployments.execute(
      'ChainlinkAggregator',
      { from: deployer },
      'add',
      tokens[baseTokenName],
      tokens[quoteTokenName],
      address
    )
  }
}

addChainlinkPairs.tags = [ 'chainlink' ]
addChainlinkPairs.dependencies = [ 'settings' ]

export default addChainlinkPairs
