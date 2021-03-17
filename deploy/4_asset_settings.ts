import { DeployFunction } from 'hardhat-deploy/types'

import { AssetSettings } from '../types/typechain'
import { getAssetSettings } from '../config/asset-settings'
import { getTokens } from '../config/tokens'
import { Network } from '../types/custom/config-types'

const createAssetSettings: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, ethers, network } = hre
  const BN = ethers.BigNumber
  const { deployer } = await getNamedAccounts()

  const assetSettings = await contracts.get<AssetSettings>('AssetSettings', {
    from: deployer,
  })

  const tokens = getTokens(<Network>network.name)
  const assetSettingsConfig = getAssetSettings(<Network>network.name)
  for (const [assetSymbol, setting] of Object.entries(assetSettingsConfig)) {
    const {
      cToken,
      aToken,
      maxLoanAmount,
      maxTVLAmount,
      maxDebtRatio,
      yVault,
    } = setting

    let tokenDecimals = 18
    if (assetSymbol !== 'ETH') {
      const token = await hre.tokens.get(assetSymbol)
      tokenDecimals = await token.decimals()
    }
    const factor = BN.from(10).pow(tokenDecimals)
    const maxLoanAmountBN = BN.from(maxLoanAmount).mul(factor)
    const maxTVLAmountBN = BN.from(maxTVLAmount).mul(factor)

    await assetSettings.createAssetSetting(
      tokens[assetSymbol],
      tokens[cToken],
      maxLoanAmountBN,
      maxTVLAmountBN,
      maxDebtRatio
    )

    if (aToken) {
      await assetSettings.updateATokenAddress(
        tokens[assetSymbol],
        tokens[aToken]
      )
    }

    if (yVault) {
      await assetSettings.updateYVaultAddressSetting(
        tokens[assetSymbol],
        tokens[yVault]
      )
    }
  }
}

createAssetSettings.tags = ['asset-settings']
createAssetSettings.dependencies = ['settings']

export default createAssetSettings
