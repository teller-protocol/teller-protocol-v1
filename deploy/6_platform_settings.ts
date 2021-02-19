import { formatBytes32String } from 'ethers/lib/utils'
import { DeployFunction } from 'hardhat-deploy/types'

import { AssetSettings, Settings } from '../types/typechain'
import { getPlatformSettings } from '../config/platform-settings'
import { getAssetSettings } from '../config/asset-settings'
import { getTokens } from '../config/tokens'
import { Network } from '../types/custom/config-types'

const createPlatformSettings: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, ethers, network } = hre
  const BN = ethers.BigNumber
  const { deployer } = await getNamedAccounts()

  const settings = await contracts.get<Settings>('Settings', { from: deployer })
  const assetSettings = await contracts.get<AssetSettings>('AssetSettings', { from: deployer })

  const platformSettings = getPlatformSettings(<Network>network.name)
  for (const [settingName, setting] of Object.entries(platformSettings)) {
    const { max, min, processOnDeployment, value } = setting

    if (processOnDeployment) await settings.createPlatformSetting(formatBytes32String(settingName), value, min, max)
  }

  const tokens = getTokens(<Network>network.name)
  const assetSettingsConfig = getAssetSettings(<Network>network.name)
  for (const [assetSymbol, setting] of Object.entries(assetSettingsConfig)) {
    const { cToken, maxLoanAmount, maxTVLAmount, maxDebtRatio } = setting

    let tokenDecimals = 18
    if (assetSymbol !== 'ETH') {
      const token = await hre.tokens.get(assetSymbol)
      tokenDecimals = await token.decimals()
    }
    const factor = BN.from(10).pow(tokenDecimals)
    const maxLoanAmountBN = BN.from(maxLoanAmount).mul(factor)
    const maxTVLAmountBN = BN.from(maxTVLAmount).mul(factor)

    await assetSettings.createAssetSetting(tokens[assetSymbol], tokens[cToken], maxLoanAmountBN, maxTVLAmountBN, maxDebtRatio)
  }
}

createPlatformSettings.tags = ['platform-settings']
createPlatformSettings.dependencies = ['register-logic']

export default createPlatformSettings
