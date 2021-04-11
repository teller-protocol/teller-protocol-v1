import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { Settings } from '../../types/typechain'
import { getPlatformSettings } from '../../config'

interface ViewPlatformSettingsArgs {}

export async function viewPlatformSettings(
  {}: ViewPlatformSettingsArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { contracts, network, ethers } = hre

  const settings = await contracts.get<Settings>('Settings')

  console.log()
  console.log(` * Platform Settings (Settings: ${settings.address}) \n`)
  console.log()

  const settingNames = Object.keys(getPlatformSettings(network))
  for (const name of settingNames) {
    const keccak = ethers.utils.id(name)
    const setting = await settings.getPlatformSetting(keccak)

    process.stdout.write(`   * ${name}: \n`)
    process.stdout.write(`     * keccak:  ${keccak} \n`)
    process.stdout.write(`     * value:   ${setting.value.toString()} \n`)
    process.stdout.write(`     * min:     ${setting.min.toString()} \n`)
    process.stdout.write(`     * max:     ${setting.max.toString()} \n`)
    console.log()
  }
}

task(
  'view-platform-settings',
  'Lists all the current platform settings'
).setAction(viewPlatformSettings)
