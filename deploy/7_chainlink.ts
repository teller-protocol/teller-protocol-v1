import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getTokens } from '../config/tokens'
import { getChainlink } from '../config/chainlink'
import { Network } from '../types/custom/config-types'
import { ChainlinkAggregator } from '../types/typechain'

const addChainlinkPairs: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, network } = hre
  const { deployer } = await getNamedAccounts()

  const tokens = getTokens(<Network>network.name)
  const chainlink = getChainlink(<Network>network.name)

  const chainlinkAggregator = await contracts.get<ChainlinkAggregator>(
    'ChainlinkAggregator',
    { from: deployer }
  )

  for (const chainlinkPair of Object.values(chainlink)) {
    const { address, baseTokenName, quoteTokenName } = chainlinkPair
    await chainlinkAggregator.add(
      tokens[baseTokenName],
      tokens[quoteTokenName],
      address
    )
  }
}

addChainlinkPairs.tags = ['chainlink']
addChainlinkPairs.dependencies = ['register-logic']

export default addChainlinkPairs
