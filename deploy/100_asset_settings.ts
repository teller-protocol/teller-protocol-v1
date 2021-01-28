import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { logicNames } from '../test/utils/logicNames'
import { Compound, ERC20, ERC20Detailed, EscrowFactory, Settings, Uniswap } from '../typechain'
import envConfig from '../config'
import { EnvConfig } from '../test/types'
import { ETH_ADDRESS } from '../test/utils/consts'

const toDecimals = (num: string | number, decimals: number): string => (BigInt(num) * 10n ** BigInt(decimals)).toString()

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, log, read, deploy, get },
    getNamedAccounts,
    ethers,
    network,
  } = hre
  const { deployer } = await getNamedAccounts()

  const env = envConfig(network.name) as EnvConfig

  const settings_ProxyDeployment = await get('Settings_Proxy')
  const settings = (await ethers.getContractAt('Settings', settings_ProxyDeployment.address)) as Settings

  const assetSettingsAddress = await settings.assetSettings()
  const assetSettings = await ethers.getContractAt('AssetSettings', assetSettingsAddress)

  for (const [tokenName, { cToken, maxLoanAmount, maxTVLAmount }] of Object.entries(env.networkConfig.assetSettings)) {
    const tokenAddress = env.networkConfig.tokens[tokenName.toUpperCase()]
    const cTokenAddress = env.networkConfig.compound[cToken.toUpperCase()]

    let decimals = 18
    if (tokenAddress !== ETH_ADDRESS) {
      const token = (await ethers.getContractAt('ERC20Detailed', tokenAddress)) as ERC20Detailed
      decimals = await token.decimals()
    }

    const maxLoanAmountWithDecimals = toDecimals(maxLoanAmount, decimals)
    await assetSettings.createAssetSetting(tokenAddress, cTokenAddress, maxLoanAmountWithDecimals)

    const maxTVLAmountWithDecimals = toDecimals(maxTVLAmount, decimals)
    await assetSettings.updateMaxTVL(tokenAddress, maxTVLAmountWithDecimals)
  }
}
export default func
func.tags = ['live', 'test']
