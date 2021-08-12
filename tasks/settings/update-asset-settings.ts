import colors from 'colors'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getAssetSettings, getTokens } from '../../config'
import { AssetSetting } from '../../types/custom/config-types'
import { ERC20, ITellerDiamond } from '../../types/typechain'
import { AssetType, CacheType } from '../../utils/consts'

interface UpdateAssetSettingsArgs {
  symbols: string[]
}

export async function updateAssetSettings(
  args: UpdateAssetSettingsArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { getNamedAccounts, contracts, ethers, toBN, network, log } = hre
  const { deployer } = await getNamedAccounts()

  log('')
  log('********** Asset Settings **********', { indent: 1 })
  log('')

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond', {
    from: deployer,
  })

  const tokens = getTokens(network)
  const assetSettingsConfig = getAssetSettings(network)
  if (args.symbols.length === 0) args.symbols = Object.keys(assetSettingsConfig)
  for (let assetSymbol of args.symbols) {
    assetSymbol = assetSymbol.toUpperCase()
    const settings = assetSettingsConfig[assetSymbol]
    if (!settings) {
      log(`!! Asset setting for ${assetSymbol} does not exist`, {
        star: true,
        indent: 2,
      })
    }

    log(`${assetSymbol}: `, { indent: 2, star: true, nl: false })

    const token = await hre.tokens.get(assetSymbol)
    const { requests, values } = await buildAssetSettingRequests(
      hre,
      token,
      settings
    )

    // Check if the asset setting is already initialized
    const isInitialized = await diamond.isAssetSettingInitialized(
      tokens.all[assetSymbol]
    )
    if (!isInitialized) {
      await diamond
        .createAssetSetting(token.address, Object.values(requests))
        .then(({ wait }) => wait())

      log(`${colors.green('newly')} created`)
    } else {
      log(`${colors.yellow('already')} created`)

      for (const [key, request] of Object.entries(requests)) {
        const keyNameMatch = key.match(/^(?<first>[a-zA-Z])(?<rest>.+)$/)
        if (!keyNameMatch) throw new Error(`Invalid setting key name: ${key}`)

        const {
          // @ts-expect-error no typescript typings for named groups
          groups: { first, rest },
        } = keyNameMatch
        const fnName = `getAsset${first.toUpperCase()}${rest}`
        // @ts-expect-error Typings don't support index accessor, but will work
        const fn = diamond[fnName]
        if (!fn) {
          log(`!! Getter function for ${fnName} does not exist !!`, {
            star: true,
            indent: 3,
          })
          continue
        }
        const existingValue = await fn(token.address)
        if (existingValue !== values[key]) {
          log(`Updating ${key}`, {
            star: true,
            indent: 3,
          })
          log(`New: ${values[key]}`, { star: true, indent: 4 })
          log(`Old: ${existingValue}`, { star: true, indent: 4 })

          const receipt = await diamond
            .updateAssetSetting(token.address, request)
            .then(({ wait }) => wait())

          const gas = colors.cyan(`${receipt.gasUsed} gas`)
          log(`with ${gas}`, { star: true, indent: 4 })
        }
      }
    }
  }

  log('')
}

type AssetSettingsRequest = Parameters<ITellerDiamond['updateAssetSetting']>[1]
interface AssetSettingsRequestObj {
  [settingKey: string]: AssetSettingsRequest
}
interface AssetSettingsValues {
  [settingKey: string]: string
}
interface BuildAssetSettingRequestReturn {
  requests: AssetSettingsRequestObj
  values: AssetSettingsValues
}
const buildAssetSettingRequests = async (
  hre: HardhatRuntimeEnvironment,
  token: ERC20,
  settings: AssetSetting[]
): Promise<BuildAssetSettingRequestReturn> => {
  const { ethers, network, toBN } = hre

  const tokens = getTokens(network)
  const decimals = await token.decimals()

  const requests: AssetSettingsRequestObj = {}
  const values: AssetSettingsValues = {}
  for (const setting of settings) {
    const key = ethers.utils.id(setting.key)
    let value: string
    let realValue: string
    let cacheType: CacheType
    switch (setting.type) {
      case AssetType.Token:
        value = realValue = ethers.utils.getAddress(tokens.all[setting.value])
        cacheType = CacheType.Address
        break

      case AssetType.Address:
        value = realValue = ethers.utils.getAddress(setting.value)
        cacheType = CacheType.Address
        break

      case AssetType.Amount:
        realValue = toBN(setting.value, decimals).toString()
        value = toBN(setting.value, decimals).toHexString()
        cacheType = CacheType.Uint
        break

      case AssetType.Bool:
        realValue = setting.value
        value = ethers.utils.hexlify(realValue)
        cacheType = CacheType.Bool
        break

      case AssetType.Uint:
        realValue = toBN(setting.value).toString()
        value = toBN(setting.value).toHexString()
        cacheType = CacheType.Uint
        break
    }

    value = ethers.utils.hexZeroPad(value, 32)
    if (ethers.BigNumber.from(value).isZero()) continue

    requests[setting.key] = {
      key,
      value,
      cacheType,
    }
    values[setting.key] = realValue
  }

  return {
    requests,
    values,
  }
}

task(
  'update-asset-settings',
  'Updates the asset setting values based on the config file'
)
  .addOptionalVariadicPositionalParam(
    'symbols',
    'List of token symbols (separated by spaces) to update asset settings for. Defaults to all in the config file',
    [],
    types.string
  )
  .setAction(updateAssetSettings)
