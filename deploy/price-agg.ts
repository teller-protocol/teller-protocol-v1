import { DeployFunction } from 'hardhat-deploy/types'

import { getChainlink, getTokens } from '../config'
import { ITellerDiamond } from '../types/typechain'
import { NULL_ADDRESS } from '../utils/consts'

const registerPriceAggregators: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, network, log } = hre
  const { deployer } = await getNamedAccounts()

  log('********** Chainlink **********', { indent: 1 })
  log('')

  const tokens = getTokens(network)
  const chainlink = getChainlink(network)

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond', {
    from: deployer,
  })

  for (const chainlinkPair of Object.values(chainlink)) {
    const { address, baseTokenName, quoteTokenName } = chainlinkPair

    log(
      `Registering aggregator for ${baseTokenName}/${quoteTokenName} pair: `,
      { indent: 2, star: true, nl: false }
    )

    // Check that the aggregator is already registered
    const { agg } = await diamond.getChainlinkAggregatorFor(
      tokens.all[baseTokenName],
      tokens.all[quoteTokenName]
    )
    if (agg === address) {
      log(`${address} already registered`)
    } else if (agg !== NULL_ADDRESS) {
      log('')
      log(
        `!! Chainlink Aggregator already registered with a different address !!`
      )
      log(
        `!!                    Please check your config                      !!`
      )
      log(`Current:  ${agg}`, { indent: 2, star: true })
      log(`New:      ${address}`, { indent: 2, star: true })
    } else {
      // Try to register the Chainlink aggregator address
      const receipt = await diamond
        .addChainlinkAggregator(
          tokens.all[baseTokenName],
          tokens.all[quoteTokenName],
          address
        )
        .then(({ wait }) => wait())

      log(`${address} with ${receipt.gasUsed} gas`)
    }
  }

  log('')
}

registerPriceAggregators.tags = ['price-agg']
registerPriceAggregators.dependencies = ['protocol']

export default registerPriceAggregators
