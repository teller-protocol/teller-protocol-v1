import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { MarketFactory, MarketRegistry } from '../types/typechain'
import { getMarket, GetMarketReturn } from '../tasks'
import { getMarkets, getSigners, getTokens } from '../config'

const createMarkets: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, network, deployments } = hre
  const { deployer } = await getNamedAccounts()

  console.log('********** Markets **********')
  console.log()

  const tokens = getTokens(network)
  const markets = getMarkets(network)

  const marketFactory = await contracts.get<MarketFactory>('MarketFactory', {
    from: deployer,
  })
  const marketRegistry = await contracts.get<MarketRegistry>('MarketRegistry')

  for (const { borrowedToken, collateralToken } of markets) {
    const lendingTokenAddress = tokens[borrowedToken]
    const collateralTokenAddress = tokens[collateralToken]

    process.stdout.write(`  * ${borrowedToken}/${collateralToken}: `)

    // Check if the market is registered
    const markets = await marketRegistry.getMarkets(lendingTokenAddress)
    const isRegistered = markets.includes(collateralTokenAddress)
    if (!isRegistered) {
      const receipt = await marketFactory
        .createMarket(lendingTokenAddress, collateralTokenAddress)
        .then(({ wait }) => wait())

      process.stdout.write(`market created with ${receipt.gasUsed} gas \n`)

      await deployments.save(`LP_${borrowedToken}`, {
        ...(await deployments.getExtendedArtifact('LendingPool')),
        address: await marketRegistry.lendingPools(lendingTokenAddress),
      })

      await deployments.save(`LM_${borrowedToken}_${collateralToken}`, {
        ...(await deployments.getExtendedArtifact('LoanManager')),
        address: await marketRegistry.loanManagers(
          lendingTokenAddress,
          collateralTokenAddress
        ),
      })
    } else {
      process.stdout.write(`market already deploy \n`)
    }

    const market = await getMarket(
      {
        lendTokenSym: borrowedToken,
        collTokenSym: collateralToken,
      },
      hre
    )

    // If it was not previously registered, add signers
    if (!isRegistered) {
      await addSigners(market, hre)
    }
  }
}

const addSigners = async (
  market: GetMarketReturn,
  hre: HardhatRuntimeEnvironment
) => {
  const { getNamedAccounts, network, getNamedSigner } = hre
  const deployer = await getNamedSigner('deployer')

  process.stdout.write(`    adding signers...: `)

  const signers = getSigners(network)
  const { craSigner } = await getNamedAccounts()
  if (craSigner) signers.push(craSigner)

  try {
    await market.loanManager
      .connect(deployer)
      .addSigners(signers)
      .then(({ wait }) => wait())

    process.stdout.write(`finished (${signers.length})`)
  } catch (err) {
    process.stdout.write(`FAILED \n`)
    throw err
  }
}

createMarkets.tags = ['markets']
createMarkets.dependencies = [
  'platform-settings',
  'asset-settings',
  'chainlink',
  'dapps',
]

export default createMarkets
