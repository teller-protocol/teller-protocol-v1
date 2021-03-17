import { DeployFunction } from 'hardhat-deploy/types'

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

  for (const chainlinkPair of chainlink) {
    const { address, baseTokenSym, quoteTokenSym } = chainlinkPair
    await chainlinkAggregator.add(
      tokens[baseTokenSym],
      tokens[quoteTokenSym],
      address
    )
  }
}

addChainlinkPairs.tags = ['chainlink']
addChainlinkPairs.dependencies = ['settings']

export default addChainlinkPairs
