import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Libraries } from 'hardhat-deploy/types'
import { Contract } from 'ethers'

import { DynamicProxy, SettingsDynamicProxy } from '../types/typechain'

export interface DeployArgs {
  hre: HardhatRuntimeEnvironment
  contract: string
  name?: string
  libraries?: Libraries
  args?: any[]
  mock?: boolean
}

export const deploy = async <C extends Contract>(
  args: DeployArgs
): Promise<C> => {
  const {
    hre: {
      deployments: { deploy },
      getNamedAccounts,
      ethers,
    },
  } = args

  const { deployer } = await getNamedAccounts()

  const contractDeployName = args.name ?? args.contract
  // If marked as mock, prepend "Mock" to the contract name
  const contractName = `${args.contract}${args.mock ? 'Mock' : ''}`
  const { address } = await deploy(contractDeployName, {
    contract: contractName,
    libraries: args.libraries,
    from: deployer,
    gasLimit: ethers.utils.hexlify(9500000),
    args: args.args,
    log: true,
  })

  return (await ethers.getContractAt(args.contract, address)) as C
}

export interface DeployLogicArgs extends Omit<DeployArgs, 'name'> {}

export const deployLogic = async (args: DeployLogicArgs): Promise<Contract> =>
  await deploy({
    ...args,
    name: `${args.contract}_Logic`,
  })

export const deployDynamicProxy = async (
  args: DeployArgs
): Promise<DynamicProxy> => {
  const {
    hre: { contracts, ethers },
  } = args

  const { address: logicRegistryAddress } = await contracts.get(
    'LogicVersionsRegistry'
  )
  const logicName = ethers.utils.id(args.contract)

  return deploy({
    hre: args.hre,
    name: args.contract,
    contract: 'DynamicProxy',
    args: [logicRegistryAddress, logicName],
  })
}

interface DeploySettingsProxyArgs {
  hre: HardhatRuntimeEnvironment
  initialLogicVersions: Array<{
    logic: string
    logicName: string
  }>
}

export const deploySettingsProxy = async (
  args: DeploySettingsProxyArgs
): Promise<SettingsDynamicProxy> => {
  const proxy = await deploy<SettingsDynamicProxy>({
    hre: args.hre,
    name: 'Settings',
    contract: 'SettingsDynamicProxy',
  })

  const tx = await proxy.initializeLogicVersions(args.initialLogicVersions)
  await tx.wait(1)

  return proxy
}
