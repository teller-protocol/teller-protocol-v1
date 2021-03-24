import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getTokens } from '../config/tokens'
import { getMarkets } from '../config/markets'
import { Network } from '../types/custom/config-types'
import {
  LoanTermsConsensus,
  MarketFactory,
  MarketRegistry,
} from '../types/typechain'
import { getMarket, GetMarketReturn } from '../tasks'
import { getSigners } from '../config/signers'

const createMarkets: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, network, deployments } = hre
  const { deployer } = await getNamedAccounts()

  const tokens = getTokens(<Network>network.name)
  const markets = getMarkets(<Network>network.name)

  const marketFactory = await contracts.get<MarketFactory>('MarketFactory', {
    from: deployer,
  })
  const marketRegistry = await contracts.get<MarketRegistry>('MarketRegistry')

  for (const { borrowedToken, collateralToken } of markets) {
    const lendingTokenAddress = tokens[borrowedToken]
    const collateralTokenAddress = tokens[collateralToken]
    await marketFactory.createMarket(
      lendingTokenAddress,
      collateralTokenAddress
    )

    const market = await getMarket(
      {
        lendTokenSym: borrowedToken,
        collTokenSym: collateralToken,
      },
      hre
    )

    if (network.name !== 'hardhat') {
      console.log(`
    Market Created
      * Pair:           ${borrowedToken}/${collateralToken}
      * Lending Pool:   ${market.lendingPool.address}
      * Loans:          ${market.loanManager.address}
      * TToken:         ${market.tToken.address} (t${borrowedToken})
      `)
    }

    await deployments.save(`LP_${borrowedToken}`, {
      ...(await deployments.getExtendedArtifact('LendingPool')),
      address: await marketRegistry.lendingPools(lendingTokenAddress),
    })

    await deployments.save(`Market_${borrowedToken}_${collateralToken}`, {
      ...(await deployments.getExtendedArtifact('LoanManager')),
      address: await marketRegistry.loanManagers(
        lendingTokenAddress,
        collateralTokenAddress
      ),
    })

    await addSigners(market, hre)
  }
}

const addSigners = async (
  market: GetMarketReturn,
  hre: HardhatRuntimeEnvironment
) => {
  const { contracts, getNamedAccounts, network } = hre

  const signers = getSigners(<Network>network.name)

  const { deployer, craSigner } = await getNamedAccounts()

  if (craSigner) signers.push(craSigner)

  await market.loanManager.addSigners(signers)
}

createMarkets.tags = ['markets']
createMarkets.dependencies = [
  'platform-settings',
  'asset-settings',
  'chainlink',
  'dapps',
]

export default createMarkets
