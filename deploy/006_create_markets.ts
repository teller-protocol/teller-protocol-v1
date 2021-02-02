import { DeployFunction } from 'hardhat-deploy/dist/types'
import { LoanTermsConsensus, MarketFactory } from '../types/typechain'
import envConfig from '../config'
import { EnvConfig } from '../test-old/types'

const func: DeployFunction = async function ({ deployments: { get, read, save, getDeploymentsFromAddress }, ethers, network }) {
  const marketFactory_ProxyDeployment = await get('MarketFactory_Proxy')
  const marketFactory = (await ethers.getContractAt('MarketFactory', marketFactory_ProxyDeployment.address)) as MarketFactory

  const env = envConfig(network.name) as EnvConfig

  const marketDefinitions = [
    { lendingTokenName: 'DAI', collateralTokenName: 'ETH' },
    { lendingTokenName: 'DAI', collateralTokenName: 'LINK' },
    { lendingTokenName: 'USDC', collateralTokenName: 'ETH' },
    { lendingTokenName: 'USDC', collateralTokenName: 'LINK' },
  ]

  for (const { collateralTokenName, lendingTokenName } of marketDefinitions) {
    const lendingTokenAddress = env.networkConfig.tokens[lendingTokenName]
    const collateralTokenAddress = env.networkConfig.tokens[collateralTokenName]

    await marketFactory.createMarket(lendingTokenAddress, collateralTokenAddress)
    const market = await marketFactory.getMarket(lendingTokenAddress, collateralTokenAddress)
    const loanTermsConsensus = (await ethers.getContractAt('LoanTermsConsensus', market.loanTermsConsensus)) as LoanTermsConsensus
    await loanTermsConsensus.addSigners(Object.values(env.networkConfig.signers))
  }
}
export default func
func.tags = ['test', 'live']
