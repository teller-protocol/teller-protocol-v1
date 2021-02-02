import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Libraries } from 'hardhat-deploy/types'
import { Contract } from 'ethers'

import { Settings, UpgradeableProxy } from '../types/typechain'
import { EnvConfig } from '../test-old/types'
import envConfig from '../config'

interface DeployArgs {
  hre: HardhatRuntimeEnvironment
  contract: string
  name?: string
  libraries?: Libraries
}

export const deploy = async (args: DeployArgs): Promise<Contract> => {
  const {
    hre: {
      deployments: { deploy },
      getNamedAccounts,
      ethers
    },
  } = args

  const { deployer } = await getNamedAccounts()

  const contractDeployName = args.name ?? args.contract
  const { address } = await deploy(contractDeployName, {
    contract: args.contract,
    libraries: args.libraries,
    from: deployer,
    gasLimit: ethers.utils.hexlify(9500000)
  })

  return ethers.getContractAt(args.contract, address)
}

interface DeployLogicArgs extends Omit<DeployArgs, 'name'> {}

export const deployLogic = async (args: DeployLogicArgs): Promise<Contract> =>
  deploy({
    ...args,
    name: `${args.contract}_Logic`
  })

interface DeployUpgradeableProxyArgs {
  hre: HardhatRuntimeEnvironment
  contract: string
  logicAddress: string
  settingsAddress: string
}

export const deployUpgradeableProxy = async (args: DeployUpgradeableProxyArgs): Promise<Contract> => {
  const {
    hre: {
      ethers
    }
  } = args

  const proxy = await deploy({
    hre: args.hre,
    name: args.contract,
    contract: 'UpgradeableProxy'
  }) as UpgradeableProxy
  await proxy.initializeProxy(args.settingsAddress, args.logicAddress)
  return ethers.getContractAt(args.contract, proxy.address)
}

interface DeploySettingsArgs {
  hre: HardhatRuntimeEnvironment
  logicAddress: string
}

export const deploySettings = async (args: DeploySettingsArgs): Promise<Settings> => {
  const {
    hre: {
      ethers,
      network
    }
  } = args
  const env = envConfig(network.name) as EnvConfig

  const { address: logicVersionsRegistryLogicAddress } = await deployLogic({
    hre: args.hre,
    contract: 'LogicVersionsRegistry'
  })

  const proxy = await deploy({
    hre: args.hre,
    name: 'Settings_Proxy',
    contract: 'UpgradeableProxy'
  }) as UpgradeableProxy
  await proxy.initializeProxy(proxy.address, args.logicAddress)

  const settings = await ethers.getContractAt('Settings', proxy.address) as Settings
  await settings['initialize(address,address,address)'](
    logicVersionsRegistryLogicAddress,
    env.networkConfig.tokens.WETH,
    env.networkConfig.compound.CETH
  )
  return settings
}
