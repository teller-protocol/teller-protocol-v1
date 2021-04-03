import { BigNumberish, Contract } from 'ethers'
import { contracts, deployments } from 'hardhat'
import { Libraries } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DynamicProxy, SettingsDynamicProxy } from '../types/typechain'

export interface DeployArgs {
  hre: HardhatRuntimeEnvironment
  contract: string
  name?: string
  libraries?: Libraries
  args?: any[]
  mock?: boolean
}

type DeployDeterministicFacetArgs = {
  contract: string
  version: string
  salt?: string
  libraries: Libraries
}
export const deployDeterministic = async <C extends Contract>(
  args: DeployDeterministicFacetArgs
) => {
  const {
    deployments: { deploy, getOrNull },
    getNamedAccounts,
    ethers,
  } = await import('hardhat')

  const { deployer } = await getNamedAccounts()

  const id = `${args.contract}_${args.version}`

  // Base contract identifier (root of inheritance) + version of the impl.
  // Every contract should be in its dedicated folder.
  const existing = await deployments.get(id)

  if (existing) return await contracts.get(id)

  const deployment = await deployments.deterministic(args.contract, {
    // What makes the address is the bytecode + deployer address + salt.
    // We should use the same salt.
    from: deployer,
    contract: args.contract,
    salt: args.salt,
    libraries: args.libraries,
  })

  return await contracts.get()
}

export const deploy = async <C extends Contract>(
  args: DeployArgs
): Promise<C> => {
  const {
    hre: {
      deployments: { deploy, getOrNull },
      getNamedAccounts,
      ethers,
    },
  } = args

  const { deployer } = await getNamedAccounts()

  const contractDeployName = args.name ?? args.contract
  const existingContract = await getOrNull(contractDeployName)
  let contractAddress: string

  if (!existingContract) {
    // If marked as mock, prepend "Mock" to the contract name
    const contractName = `${args.contract}${args.mock ? 'Mock' : ''}`

    process.stdout.write(` * Deploying ${contractDeployName}...: `)

    const { address, receipt } = await deploy(contractDeployName, {
      contract: contractName,
      libraries: args.libraries,
      from: deployer,
      gasLimit: ethers.utils.hexlify(9500000),
      args: args.args,
    })

    contractAddress = address
    process.stdout.write(
      `${address} ${receipt ? `with ${receipt.gasUsed} gas` : ''} \n`
    )
  } else {
    contractAddress = existingContract.address
    process.stdout.write(
      ` * Reusing ${contractDeployName} deployment at ${existingContract.address} \n`
    )
  }

  return (await ethers.getContractAt(args.contract, contractAddress)) as C
}

export interface DeployLogicArgs extends Omit<DeployArgs, 'name'> {}

export const deployLogic = async (
  args: DeployLogicArgs,
  version: BigNumberish = 0
): Promise<Contract> =>
  await deploy({
    ...args,
    name: `${args.contract}_Logic_v${version.toString()}`,
  })

interface DeployDynamicProxyArgs extends Omit<DeployArgs, 'args'> {
  strictDynamic: boolean
}

interface DeployDynamicProxyReturn<C> {
  proxy: DynamicProxy
  contract: C
}

export const deployDynamicProxy = async <C extends Contract>(
  args: DeployDynamicProxyArgs
): Promise<DeployDynamicProxyReturn<C>> => {
  const {
    hre: { deployments, contracts, ethers },
  } = args

  // Get the LogicVersionsRegistry and logic name
  const { address: logicRegistryAddress } = await contracts.get(
    'LogicVersionsRegistry'
  )
  const logicName = ethers.utils.id(args.contract)

  // Deploy DynamicProxy
  const proxy = await deploy<DynamicProxy>({
    hre: args.hre,
    name: `${args.contract}_DP`,
    contract: 'DynamicProxy',
    args: [logicRegistryAddress, logicName, args.strictDynamic],
  })

  // Save deployment for the underlying contract logic
  const name = args.name ?? args.contract
  await deployments.save(name, {
    ...(await deployments.getExtendedArtifact(args.contract)),
    address: proxy.address,
  })

  // Fetch the logic contract instance with the proxy address
  const contract = (await ethers.getContractAt(
    args.contract,
    proxy.address
  )) as C

  return { proxy, contract }
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
): Promise<SettingsDynamicProxy> =>
  deploy<SettingsDynamicProxy>({
    hre: args.hre,
    name: 'Settings',
    contract: 'SettingsDynamicProxy',
    args: [args.initialLogicVersions],
  })
