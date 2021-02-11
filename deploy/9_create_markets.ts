import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getTokens } from '../config/tokens'
import { getMarkets } from '../config/markets'
import { Network } from '../types/custom/config-types'
import { MarketFactory } from '../types/typechain'

const createMarkets: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, network } = hre
  const { deployer } = await getNamedAccounts()

  const tokens = getTokens(<Network>network.name)
  const markets = getMarkets(<Network>network.name)

  const marketFactory = await contracts.get<MarketFactory>('MarketFactory', { from: deployer })

  for (const market of markets) {
    const { borrowedToken, collateralToken } = market
    await marketFactory.createMarket(
      tokens[borrowedToken],
      tokens[collateralToken]
    )
  }
}

createMarkets.tags = [ 'markets' ]
createMarkets.dependencies = [ 'platform-settings' ]

export default createMarkets
