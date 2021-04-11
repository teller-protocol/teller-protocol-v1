import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { Settings } from '../../types/typechain'
import { getPlatformSettings } from '../../config'

interface UpdatePlatformSettingsArgs {
  name: string
  value: number
}

export async function updatePlatformSettings(
  args: UpdatePlatformSettingsArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { name, value } = args
  const { contracts, network, ethers } = hre

  console.log()

  const settingNames = Object.keys(getPlatformSettings(network))
  if (!settingNames.includes(name)) {
    console.log(`  >>>>>> Setting name does not exist: ${name} <<<<<<`)

    console.log('Choose from the following list:')
    console.log(JSON.stringify(settingNames, null, 2))

    return
  }

  const settings = await contracts.get<Settings>('Settings')

  const keccak = ethers.utils.id(name)
  const currentSetting = await settings.getPlatformSetting(keccak)

  await settings.updatePlatformSetting(keccak, value)

  console.log(` * Platform Settings (Settings: ${settings.address}) \n`)

  process.stdout.write(`   * ${name}: \n`)
  process.stdout.write(
    `     * old value:   ${currentSetting.value.toString()} \n`
  )
  process.stdout.write(`     * new value:   ${value} \n`)
  process.stdout.write(
    `     * min:         ${currentSetting.min.toString()} \n`
  )
  process.stdout.write(
    `     * max:         ${currentSetting.max.toString()} \n`
  )

  console.log()
}

task('update-platform-setting', 'Updates a platform setting value')
  .addParam('name', 'Name of the platform setting')
  .addParam('value', 'Value to update the setting to', null, types.int)
  .setAction(updatePlatformSettings)
