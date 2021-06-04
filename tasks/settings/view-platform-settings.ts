import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getPlatformSettings } from '../../config'
import { ITellerDiamond } from '../../types/typechain'

interface ViewPlatformSettingsArgs {
  name?: string
}

type GetPlatformSettingsReturn = PromiseReturnType<
  ITellerDiamond['getPlatformSetting']
>

export async function viewPlatformSettings(
  args: ViewPlatformSettingsArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { network, log } = hre

  log('')
  log(`Platform Settings`, {
    indent: 1,
    star: true,
  })
  log('')

  if (args.name == null) {
    const settingNames = Object.keys(getPlatformSettings(network))
    for (const name of settingNames) {
      await getPlatformSetting(name, hre)
    }
  } else {
    await getPlatformSetting(args.name, hre)
  }
}

export const getPlatformSetting = async (
  name: string,
  hre: HardhatRuntimeEnvironment
): Promise<GetPlatformSettingsReturn> => {
  const diamond = await hre.contracts.get<ITellerDiamond>('TellerDiamond')

  const keccak = hre.ethers.utils.id(name)
  const setting = await diamond.getPlatformSetting(keccak)

  hre.log(`${name}:`, { indent: 2, star: true })
  hre.log(`keccak:  ${keccak}`, { indent: 3, star: true })
  hre.log(`value:   ${setting.value.toString()}`, { indent: 3, star: true })
  hre.log(`min:     ${setting.min.toString()}`, { indent: 3, star: true })
  hre.log(`max:     ${setting.max.toString()}`, { indent: 3, star: true })
  hre.log('')

  return setting
}

task('view-platform-settings', 'Lists the current platform settings')
  .addOptionalParam(
    'name',
    'Get a specific platform setting',
    undefined,
    types.string
  )
  .setAction(viewPlatformSettings)
