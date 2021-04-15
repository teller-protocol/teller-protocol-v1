import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getMarket, GetMarketReturn } from '../tasks'
import { getMarkets, getSigners, getTokens } from '../config'
import { ITellerDiamond } from '../types/typechain'

const initializeMarkets: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, tokens, network, deployments, log } = hre
  const { deployer } = await getNamedAccounts()

  log('********** Lending Pools **********')
  log('')

  const tokenAddresses = getTokens(network)
  const markets = getMarkets(network)

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')

  for (const { lendingToken, collateralTokens } of markets) {
    const lendingTokenAddress = tokenAddresses.all[lendingToken]
    const asset = await tokens.get(lendingToken)
    const name = await asset.name()

    log(`${name} (${lendingToken})`, { indent: 1, star: true })

    // Check if the market is registered
    const isRegistered = await diamond.getTToken(lendingTokenAddress)
    if (!isRegistered) {
      // Get initial signers to add
      const signers = getSigners(network)
      const { craSigner } = await getNamedAccounts()
      if (craSigner) signers.push(craSigner)

      const receipt = await diamond
        .initializeLendingPool({
          asset: lendingTokenAddress,
          collateralTokens,
        })
        .then(({ wait }) => wait())

      log(`Lending pool initialized with ${receipt.gasUsed} gas`, {
        indent: 2,
        star: true,
      })
    } else {
      log(`Lending pool ALREADY initialized`, { indent: 2, star: true })
    }
  }
}

initializeMarkets.tags = ['markets']
initializeMarkets.dependencies = [
  'platform-settings',
  'asset-settings',
  'price-agg',
  'dapps',
]

export default initializeMarkets
