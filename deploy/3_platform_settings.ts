import { formatBytes32String } from 'ethers/lib/utils'
import { DeployFunction } from 'hardhat-deploy/types'

import { Settings } from '../types/typechain'
import { getPlatformSettings } from '../config/platform-settings'
import { Network } from '../types/custom/config-types'

const createPlatformSettings: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, network } = hre
  const { deployer } = await getNamedAccounts()

  const settings = await contracts.get<Settings>('Settings', { from: deployer })
  const platformSettings = getPlatformSettings(<Network>network.name)
  for (const [settingName, setting] of Object.entries(platformSettings)) {
    const { max, min, processOnDeployment, value } = setting

    if (processOnDeployment)
      await settings.createPlatformSetting(
        formatBytes32String(settingName),
        value,
        min,
        max
      )
  }
}

createPlatformSettings.tags = ['platform-settings']
createPlatformSettings.dependencies = ['settings']

export default createPlatformSettings
