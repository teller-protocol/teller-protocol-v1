import { DeployFunction } from 'hardhat-deploy/types'

const createAssetSettings: DeployFunction = async (hre) => {
  await hre.run('update-asset-settings')

  hre.log('')
}

createAssetSettings.tags = ['asset-settings']
createAssetSettings.dependencies = ['protocol']

export default createAssetSettings
