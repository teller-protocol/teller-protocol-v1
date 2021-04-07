import { DeployFunction } from 'hardhat-deploy/types'

import { Settings } from '../types/typechain'
import { getPlatformSettings } from '../config'

const createPlatformSettings: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, ethers, network } = hre
  const { deployer } = await getNamedAccounts()

  console.log('********** Platform Settings **********')
  console.log()

  const settings = await contracts.get<Settings>('Settings', { from: deployer })
  const platformSettings = getPlatformSettings(network)
  for (const [settingName, setting] of Object.entries(platformSettings)) {
    const { max, min, processOnDeployment, value } = setting

    if (processOnDeployment) {
      const keccak = ethers.utils.id(settingName)
      process.stdout.write(`  * ${settingName}: `)

      // Check if the platform setting has already been created
      const platformSetting = await settings.getPlatformSetting(keccak)
      if (platformSetting.exists) {
        process.stdout.write(
          `already created (value: ${platformSetting.value} / min: ${platformSetting.min} / max: ${platformSetting.max}) \n`
        )
      } else {
        await settings
          .createPlatformSetting(keccak, value, min, max)
          .then(({ wait }) => wait())

        process.stdout.write(
          `created (value: ${value} / min: ${min} / max: ${max}) \n`
        )
      }
    }
  }

  console.log()
}

createPlatformSettings.tags = ['platform-settings']
createPlatformSettings.dependencies = ['settings']

export default createPlatformSettings
