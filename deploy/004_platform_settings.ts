import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import envConfig from '../config'
import { formatBytes32String } from 'ethers/lib/utils'
import { Settings } from '../typechain'
import { EnvConfig } from '../test/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, log, read, deploy, get },
    getNamedAccounts,
    ethers,
    network,
  } = hre
  const { deployer } = await getNamedAccounts()

  const env = envConfig(network.name) as EnvConfig

  const settings_ProxyDeployment = await get('Settings')
  const settings = (await ethers.getContractAt('Settings', settings_ProxyDeployment.address)) as Settings

  for (const [platformSettingName, { value, min, max, processOnDeployment }] of Object.entries(
    env.networkConfig.platformSettings
  )) {
    if (processOnDeployment) await settings.createPlatformSetting(formatBytes32String(platformSettingName), value, min, max)
  }
}
export default func
func.tags = ['test', 'live', 'platform-settings']
func.dependencies = ['settings']
