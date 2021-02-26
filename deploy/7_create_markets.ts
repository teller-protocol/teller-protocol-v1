import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getTokens } from '../config/tokens'
import { getMarkets } from '../config/markets'
import { Market, Network } from '../types/custom/config-types'
import {
  LoanTermsConsensus,
  MarketFactory,
  MarketRegistry,
} from '../types/typechain'
import { getMarket } from '../tasks'
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

  for (const market of markets) {
    const { borrowedToken, collateralToken } = market
    const lendingTokenAddress = tokens[borrowedToken]
    const collateralTokenAddress = tokens[collateralToken]
    await marketFactory.createMarket(
      lendingTokenAddress,
      collateralTokenAddress
    )

    const lendingPoolAddress = await marketRegistry.lendingPools(
      lendingTokenAddress
    )
    const lendingPoolArtifact = await deployments.getExtendedArtifact(
      'LendingPool'
    )
    await deployments.save(`LP_${borrowedToken}`, {
      ...lendingPoolArtifact,
      address: lendingPoolAddress,
    })

    const loansAddress = await marketRegistry.loans(
      lendingTokenAddress,
      collateralTokenAddress
    )
    const loansArtifact = await deployments.getExtendedArtifact('Loans')
    await deployments.save(`Market_${borrowedToken}_${collateralToken}`, {
      ...loansArtifact,
      address: loansAddress,
    })

    await addSigners(market, hre)
  }
}

const addSigners = async (market: Market, hre: HardhatRuntimeEnvironment) => {
  const { contracts, getNamedAccounts, network } = hre

  const signers = getSigners(<Network>network.name)

  const { deployer, craSigner } = await getNamedAccounts()
  if (craSigner) signers.push(craSigner)

  const { loans } = await getMarket(
    {
      lendTokenSym: market.borrowedToken,
      collTokenSym: market.collateralToken,
    },
    hre
  )
  const termsConsensusAddress = await loans.loanTermsConsensus()
  const termsConsensus = await contracts.get<LoanTermsConsensus>(
    'LoanTermsConsensus',
    {
      at: termsConsensusAddress,
      from: deployer,
    }
  )
  await termsConsensus.addSigners(signers)
}

createMarkets.tags = ['markets']
createMarkets.dependencies = [
  'platform-settings',
  'asset-settings',
  'chainlink',
  'dapps',
]

export default createMarkets
