import { DeployFunction } from 'hardhat-deploy/dist/types'
import { getTokens } from '../config/tokens'
import { getMarkets } from '../config/markets'
import { Network } from '../types/custom/config-types'

const createMarkets: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, network } = hre
  const { deployer } = await getNamedAccounts()

  const tokens = getTokens(<Network>network.name)
  const markets = getMarkets(<Network>network.name)

  for (const market of markets) {
    const { borrowedToken, collateralToken } = market
    await deployments.execute(
      'MarketFactory',
      { from: deployer },
      'createMarket',
      tokens[borrowedToken],
      tokens[collateralToken]
    )
  }
}

createMarkets.tags = [ 'markets' ]
createMarkets.dependencies = [ 'platform-settings' ]

export default createMarkets
