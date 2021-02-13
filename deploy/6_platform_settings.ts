import { formatBytes32String } from 'ethers/lib/utils'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { AssetSettings, Settings } from '../types/typechain'
import { getPlatformSettings } from '../config/platform-settings'
import { getAssetSettings } from '../config/asset-settings'
import { getTokens } from '../config/tokens'
import { Network } from '../types/custom/config-types'

const createPlatformSettings: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, ethers, network } = hre
  const { deployer } = await getNamedAccounts()

  const { address: settingsAddress } = await deployments.get('Settings')
  const settings = await ethers.getContractAt('Settings', settingsAddress) as Settings
  const assetSettingsAddress = await settings.assetSettings()
  const assetSettings = await ethers.getContractAt('AssetSettings', assetSettingsAddress) as AssetSettings

  const platformSettings = getPlatformSettings(<Network>network.name)
  for (const [ settingName, setting ] of Object.entries(platformSettings)) {
    const {
      max,
      min,
      processOnDeployment,
      value
    } = setting

    if (processOnDeployment)
      await settings.attach(deployer).createPlatformSetting(
        formatBytes32String(settingName),
        value,
        min,
        max
      )
  }

  const tokens = getTokens(<Network>network.name)
  const assetSettingsConfig = getAssetSettings(<Network>network.name)
  for (const [ assetSymbol, setting ] of Object.entries(assetSettingsConfig)) {
    const {
      cToken,
      maxLoanAmount,
      maxTVLAmount
    } = setting

    await assetSettings.attach(deployer).createAssetSetting(
      tokens[assetSymbol],
      tokens[cToken],
      maxLoanAmount
    )
    await assetSettings.attach(deployer).updateMaxTVL(
      tokens[assetSymbol],
      maxTVLAmount
    )
  }
}

createPlatformSettings.tags = [ 'platform-settings' ]
createPlatformSettings.dependencies = [ 'register-logic' ]

export default createPlatformSettings
