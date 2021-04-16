import { DeployFunction } from 'hardhat-deploy/types'

import { getAssetSettings, getTokens } from '../config'
import { ITellerDiamond } from '../types/typechain'
import { AssetType, CacheType } from '../utils/consts'

const createAssetSettings: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, ethers, toBN, network, log } = hre
  const { deployer } = await getNamedAccounts()

  log('********** Asset Settings **********', { indent: 1 })
  log('')

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond', {
    from: deployer,
  })

  const tokens = getTokens(network)
  const assetSettingsConfig = getAssetSettings(network)
  for (const [assetSymbol, settings] of Object.entries(assetSettingsConfig)) {
    log(`${assetSymbol}: `, { indent: 2, star: true, nl: false })

    const assetAddress = tokens.all[assetSymbol]

    // Check if the asset setting is already initialized
    const isInitialized = await diamond.isAssetSettingInitialized(assetAddress)
    if (!isInitialized) {
      const token = await hre.tokens.get(assetSymbol)
      const decimals = await token.decimals()

      const requests: Parameters<ITellerDiamond['createAssetSetting']>[1] = []

      for (const setting of settings) {
        const key = ethers.utils.id(setting.key)
        let value: string
        let cacheType: CacheType
        switch (setting.type) {
          case AssetType.Address:
            value = tokens.all[setting.value]
            cacheType = CacheType.Address
            break

          case AssetType.Amount:
            value = toBN(setting.value, decimals).toHexString()
            cacheType = CacheType.Uint
            break

          case AssetType.Bool:
            value = ethers.utils.hexlify(setting.value)
            cacheType = CacheType.Bool
            break

          case AssetType.Uint:
            value = toBN(setting.value).toHexString()
            cacheType = CacheType.Uint
            break
        }

        value = ethers.utils.hexZeroPad(value, 32)
        if (ethers.BigNumber.from(value).isZero()) continue

        requests.push({
          key,
          value,
          cacheType,
        })
      }

      await diamond
        .createAssetSetting(token.address, requests)
        .then(({ wait }) => wait())

      log(`created`)
    } else {
      log(`already created`)
    }
  }

  log('')
}

createAssetSettings.tags = ['asset-settings']
createAssetSettings.dependencies = ['protocol']

export default createAssetSettings
