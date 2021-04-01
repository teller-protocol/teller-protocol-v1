import { DeployFunction } from 'hardhat-deploy/types'

import { AssetSettings } from '../types/typechain'
import { getAssetSettings } from '../config/asset-settings'
import { getTokens } from '../config/tokens'
import { Network } from '../types/custom/config-types'

const createAssetSettings: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, ethers, network } = hre
  const BN = ethers.BigNumber
  const { deployer } = await getNamedAccounts()

  console.log('********** Asset Settings **********')
  console.log()

  const assetSettings = await contracts.get<AssetSettings>('AssetSettings', {
    from: deployer,
  })

  const tokens = getTokens(<Network>network.name)
  const assetSettingsConfig = getAssetSettings(<Network>network.name)
  for (const [assetSymbol, setting] of Object.entries(assetSettingsConfig)) {
    process.stdout.write(`  * ${assetSymbol}: `)

    const assetAddress = tokens[assetSymbol]

    // Check if the asset setting is already initialized
    const isInitialized = await assetSettings.isInitialized(assetAddress)
    if (!isInitialized) {
      const {
        cToken,
        aToken,
        maxLoanAmount,
        maxTVLAmount,
        maxDebtRatio,
        yVault,
        pPool,
      } = setting

      let tokenDecimals = 18
      if (assetSymbol !== 'ETH') {
        const token = await hre.tokens.get(assetSymbol)
        tokenDecimals = await token.decimals()
      }
      const factor = BN.from(10).pow(tokenDecimals)
      const maxLoanAmountBN = BN.from(maxLoanAmount).mul(factor)
      const maxTVLAmountBN = BN.from(maxTVLAmount).mul(factor)

      await assetSettings
        .createAssetSetting(
          assetAddress,
          tokens[cToken],
          maxLoanAmountBN,
          maxTVLAmountBN,
          maxDebtRatio
        )
        .then(({ wait }) => wait())

      if (aToken) {
        await assetSettings
          .updateATokenAddress(assetAddress, tokens[aToken])
          .then(({ wait }) => wait())
      }

      if (yVault) {
        await assetSettings
          .updateYVaultAddressSetting(assetAddress, tokens[yVault])
          .then(({ wait }) => wait())
      }

      if (pPool) {
        await assetSettings
          .updatePrizePoolAddress(tokens[assetSymbol], tokens[pPool])
          .then(({ wait }) => wait())
      }

      process.stdout.write(`created \n`)
    } else {
      process.stdout.write(`already created \n`)
    }
  }

  console.log()
}

createAssetSettings.tags = ['asset-settings']
createAssetSettings.dependencies = ['settings']

export default createAssetSettings
