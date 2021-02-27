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
  const { address } = await deploy(contractDeployName, {
    contract: args.contract,
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
    hre: { deployments, contracts, ethers },
  } = args

  const { address: logicRegistryAddress } = await contracts.get(
    'LogicVersionsRegistry'
  )
  const logicName = ethers.utils.id(args.contract)

  const proxy = (await deploy({
    hre: args.hre,
    name: args.contract,
    contract: 'DynamicProxy',
    args: [logicRegistryAddress, logicName],
  })) as DynamicProxy

  const { abi } = await deployments.getArtifact(args.contract)
  await deployments.save(args.contract, {
    abi,
    address: proxy.address,
  })
  return proxy
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
