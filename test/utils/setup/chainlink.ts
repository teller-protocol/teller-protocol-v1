import { deploySettings } from './settings'
import { DeployConfig } from './types'
import { ChainlinkAggregatorInstance, SettingsInstance } from '../../../types/truffle-contracts'

const Settings = artifacts.require('Settings')
const ChainlinkAggregator = artifacts.require('ChainlinkAggregator')

interface ChainlinkConfig extends DeployConfig {
  settingsAddress?: string
}

interface DeployChainlinkResponse {
  settings: SettingsInstance
  chainlinkAggregator: ChainlinkAggregatorInstance
}

export async function deployChainlink(config: ChainlinkConfig): Promise<DeployChainlinkResponse> {
  const chainlinkAggregator = await ChainlinkAggregator.new()

  let settings: SettingsInstance
  if (config.settingsAddress) {
    settings = await Settings.at(config.settingsAddress)
  } else {
    const response = await deploySettings({
      deployerAddress: config.deployerAddress,
      network: config.network,
      initData: {
        chainlinkAggregatorAddress: chainlinkAggregator.address
      }
    })
    settings = response.settings
  }

  await chainlinkAggregator.initialize(settings.address, { from: config.deployerAddress })

  return {
    settings,
    chainlinkAggregator
  }
}