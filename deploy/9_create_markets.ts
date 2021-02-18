import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getTokens } from '../config/tokens'
import { getMarkets } from '../config/markets'
import { Market, Network } from '../types/custom/config-types'
import { LoanTermsConsensus, MarketFactory } from '../types/typechain'
import { getMarket } from '../tasks'
import { getSigners } from '../config/signers'

const createMarkets: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, network, artifacts, deployments } = hre
  const { deployer } = await getNamedAccounts()

  const tokens = getTokens(<Network>network.name)
  const markets = getMarkets(<Network>network.name)

  const marketFactory = await contracts.get<MarketFactory>('MarketFactory', { from: deployer })

  const marketRegistryAddress = await marketFactory.marketRegistry()
  const marketRegistryArtifact = await artifacts.readArtifact('MarketRegistry')
  await deployments.save('MarketRegistry', {
    address: marketRegistryAddress,
    abi: marketRegistryArtifact.abi,
  })

  for (const market of markets) {
    const { borrowedToken, collateralToken } = market
    await marketFactory.createMarket(tokens[borrowedToken], tokens[collateralToken])

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
  const termsConsensus = await contracts.get<LoanTermsConsensus>('LoanTermsConsensus', {
    at: termsConsensusAddress,
    from: deployer,
  })
  await termsConsensus.addSigners(signers)
}

createMarkets.tags = ['markets']
createMarkets.dependencies = ['platform-settings']

export default createMarkets
