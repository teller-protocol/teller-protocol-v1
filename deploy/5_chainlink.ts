import { DeployFunction } from 'hardhat-deploy/types'

import { getTokens } from '../config/tokens'
import { getChainlink } from '../config/chainlink'
import { Network } from '../types/custom/config-types'
import { ChainlinkPair, Tokens } from '../types/custom/config-types'
import { PriceAggregator } from '../types/typechain'

const addChainlinkPairs: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, network } = hre
  const { deployer } = await getNamedAccounts()

  const tokens = getTokens(<Network>network.name)
  const chainlink = getChainlink(<Network>network.name)

  const priceAggregator = await contracts.get<PriceAggregator>(
    'PriceAggregator',
    { from: deployer }
  )

  for (const key in chainlink) {
    const chainlinkPair = chainlink[key]
    await register({
      tokens,
      priceAggregator,
      chainlinkPair,
    })
  }
}

interface RegisterArgs {
  priceAggregator: PriceAggregator
  chainlinkPair: ChainlinkPair
  tokens: Tokens
}

const register = async (args: RegisterArgs): Promise<void> => {
  const { priceAggregator, chainlinkPair, tokens } = args
  const { baseTokenName, quoteTokenName, address } = chainlinkPair

  process.stdout.write(
    ` * Registering aggregator for ${baseTokenName}/${quoteTokenName} pair: `
  )

  // Check that the aggregator is already registered
  const [aggregatorAddress] = await priceAggregator.aggregatorFor(
    tokens[baseTokenName],
    tokens[quoteTokenName]
  )
  if (aggregatorAddress === address) {
    process.stdout.write(`reusing ${address} \n`)
  } else {
    // Try to register the Chainlink aggregator address
    const receipt = await priceAggregator
      .add(tokens[baseTokenName], tokens[quoteTokenName], address)
      .then(({ wait }) => wait())

    process.stdout.write(`${address} with ${receipt.gasUsed} gas \n`)
  }
}

addChainlinkPairs.tags = ['chainlink']
addChainlinkPairs.dependencies = ['settings']

export default addChainlinkPairs
