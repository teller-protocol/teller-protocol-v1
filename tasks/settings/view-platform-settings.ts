import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getPlatformSettings } from '../../config'
import { ITellerDiamond } from '../../types/typechain'

interface ViewPlatformSettingsArgs {}

export async function viewPlatformSettings(
  args: ViewPlatformSettingsArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { contracts, network, ethers, log } = hre

  const settings = await contracts.get<ITellerDiamond>('TellerDiamond')

  log('')
  log(`Platform Settings (Settings: ${settings.address})`, {
    indent: 1,
    star: true,
  })
  log('')

  const settingNames = Object.keys(getPlatformSettings(network))
  for (const name of settingNames) {
    const keccak = ethers.utils.id(name)
    const setting = await settings.getPlatformSetting(keccak)

    log(`${name}:`, { indent: 2, star: true })
    log(`keccak:  ${keccak}`, { indent: 3, star: true })
    log(`value:   ${setting.value.toString()}`, { indent: 3, star: true })
    log(`min:     ${setting.min.toString()}`, { indent: 3, star: true })
    log(`max:     ${setting.max.toString()}`, { indent: 3, star: true })
    log('')
  }
}

task(
  'view-platform-settings',
  'Lists all the current platform settings'
).setAction(viewPlatformSettings)
