import { DeployFunction } from 'hardhat-deploy/types'

import { deployUpgradeableProxy } from '../utils/deployHelpers'
import { Settings } from '../types/typechain'
import { getTokens } from '../config/tokens'
import { Network } from '../types/custom/config-types'

const initializeSettings: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, contracts, ethers, network } = hre
  const { deployer } = await getNamedAccounts()

  const tokens = getTokens(<Network>network.name)

  const settingsLogic = await deployments.get('Settings_Logic')
  const logicVersionsRegistryLogic = await deployments.get('LogicVersionsRegistry_Logic')

  const settingsProxy = await deployUpgradeableProxy({
    hre,
    contract: 'Settings'
  })
  await settingsProxy.initializeProxy(
    settingsProxy.address,
    settingsLogic.address
  )
  const settings = await contracts.get<Settings>('Settings', { from: deployer })
  await settings['initialize(address,address,address)'](
    logicVersionsRegistryLogic.address,
    tokens.WETH,
    tokens.CETH
  )

  const logicVersionsRegistryProxyAddress = await settings.versionsRegistry()
  await deployments.save('LogicVersionsRegistry', {
    address: logicVersionsRegistryProxyAddress,
    abi: logicVersionsRegistryLogic.abi
  })

  const chainlinkAggregatorProxyAddress = await settings.chainlinkAggregator()
  const chainlinkAggregatorLogic = await deployments.get('ChainlinkAggregator_Logic')
  await deployments.save('ChainlinkAggregator', {
    address: chainlinkAggregatorProxyAddress,
    abi: chainlinkAggregatorLogic.abi
  })

  const assetSettingsProxyAddress = await settings.assetSettings()
  const assetSettingsLogic = await deployments.get('AssetSettings_Logic')
  await deployments.save('AssetSettings', {
    address: assetSettingsProxyAddress,
    abi: assetSettingsLogic.abi
  })

  const escrowFactoryProxyAddress = await settings.escrowFactory()
  const escrowFactoryLogic = await deployments.get('EscrowFactory_Logic')
  await deployments.save('EscrowFactory', {
    address: escrowFactoryProxyAddress,
    abi: escrowFactoryLogic.abi
  })

  const marketFactoryProxyAddress = await settings.marketFactory()
  const marketFactoryLogic = await deployments.get('MarketFactory_Logic')
  await deployments.save('MarketFactory', {
    address: marketFactoryProxyAddress,
    abi: marketFactoryLogic.abi
  })
}

initializeSettings.tags = [ 'settings' ]
initializeSettings.dependencies = [ 'logic' ]

export default initializeSettings
