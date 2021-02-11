import { DeployFunction } from 'hardhat-deploy/dist/types'

import { LogicVersionsRegistry, Settings } from '../types/typechain'

const registerLogicVersions: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, contracts, ethers } = hre
  const { deployer } = await getNamedAccounts()

  const logicNames = [
    { identifier: 'ChainlinkAggregator_Logic', logicName: ethers.utils.id('ChainlinkAggregator') },
    { identifier: 'TToken_Logic', logicName: ethers.utils.id('TToken') },
    { identifier: 'EtherCollateralLoans_Logic', logicName: ethers.utils.id('EtherCollateralLoans') },
    { identifier: 'TokenCollateralLoans_Logic', logicName: ethers.utils.id('TokenCollateralLoans') },
    { identifier: 'LendingPool_Logic', logicName: ethers.utils.id('LendingPool') },
    { identifier: 'LoanTermsConsensus_Logic', logicName: ethers.utils.id('LoanTermsConsensus') },
    { identifier: 'EscrowFactory_Logic', logicName: ethers.utils.id('EscrowFactory') },
    { identifier: 'MarketFactory_Logic', logicName: ethers.utils.id('MarketFactory') },
    { identifier: 'Uniswap_Logic', logicName: ethers.utils.id('Uniswap') },
    { identifier: 'Compound_Logic', logicName: ethers.utils.id('Compound') },
    { identifier: 'AssetSettings_Logic', logicName: ethers.utils.id('AssetSettings') }
  ]

  const requests = await Promise.all(
    logicNames.map(async ({ identifier, logicName }) => ({
      logic: (await deployments.get(identifier)).address,
      logicName
    }))
  )

  const versionsRegistry = await contracts.get<LogicVersionsRegistry>('LogicVersionsRegistry', {
    from: deployer
  })
  await versionsRegistry.createLogicVersions(requests)

  const settings = await contracts.get<Settings>('Settings', { from: deployer })
  await settings.postLogicVersionsRegistered()
}

registerLogicVersions.tags = [ 'register-logic' ]
registerLogicVersions.dependencies = [ 'settings', 'dynamic-proxies' ]

export default registerLogicVersions
