import { DeployFunction } from 'hardhat-deploy/types'

import { getPlatformSettings } from '../config'
import { ITellerDiamond } from '../types/typechain'

const createPlatformSettings: DeployFunction = async (hre) => {
  const { getNamedSigner, contracts, ethers, network, log } = hre

  const deployer = await getNamedSigner('deployer')

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond', {
    from: deployer,
  })

  log('********** Platform Settings **********', { indent: 1 })
  log('')

  const platformSettings = getPlatformSettings(network)
  for (const [settingName, setting] of Object.entries(platformSettings)) {
    const { max, min, processOnDeployment, value } = setting

    if (processOnDeployment) {
      const keccak = ethers.utils.id(settingName)
      log(`${settingName}: `, { indent: 2, star: true, nl: false })

      // Check if the platform setting has already been created
      const platformSetting = await diamond.getPlatformSetting(keccak)
      if (platformSetting.exists) {
        log(
          `already created (value: ${platformSetting.value} / min: ${platformSetting.min} / max: ${platformSetting.max})`
        )
      } else {
        await diamond
          .createPlatformSetting(keccak, value, min, max)
          .then(({ wait }) => wait())

        log(`created (value: ${value} / min: ${min} / max: ${max})`)
      }
    }
  }

  log('')
}

createPlatformSettings.tags = ['platform-settings']
createPlatformSettings.dependencies = ['protocol']

export default createPlatformSettings
