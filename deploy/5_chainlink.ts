import { DeployFunction } from 'hardhat-deploy/types'

import { getChainlink, getTokens } from '../config'
import { ChainlinkAggregator } from '../types/typechain'
import { NULL_ADDRESS } from '../utils/consts'

const addChainlinkPairs: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, network } = hre
  const { deployer } = await getNamedAccounts()

  console.log('********** Chainlink **********')
  console.log()

  const tokens = getTokens(network)
  const chainlink = getChainlink(network)

  const chainlinkAggregator = await contracts.get<ChainlinkAggregator>(
    'ChainlinkAggregator',
    { from: deployer }
  )

  for (const chainlinkPair of Object.values(chainlink)) {
    const { address, baseTokenName, quoteTokenName } = chainlinkPair

    process.stdout.write(
      ` * Registering aggregator for ${baseTokenName}/${quoteTokenName} pair: `
    )

    // Check that the aggregator is already registered
    const [aggregatorAddress] = await chainlinkAggregator.aggregatorFor(
      tokens[baseTokenName],
      tokens[quoteTokenName]
    )
    if (aggregatorAddress === address) {
      process.stdout.write(`reusing ${address} \n`)
    } else {
      // Try to register the Chainlink aggregator address
      const receipt = await chainlinkAggregator
        .add(tokens[baseTokenName], tokens[quoteTokenName], address)
        .then(({ wait }) => wait())

      process.stdout.write(`${address} with ${receipt.gasUsed} gas \n`)
    }
  }

  console.log()
}

addChainlinkPairs.tags = ['chainlink']
addChainlinkPairs.dependencies = ['settings']

export default addChainlinkPairs
