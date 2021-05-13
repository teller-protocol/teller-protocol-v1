import colors from 'colors'
import { makeNodeDisklet } from 'disklet'
import { Contract } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployOptions, DeployResult } from 'hardhat-deploy/dist/types'
import { Libraries } from 'hardhat-deploy/types'

interface CommonDeployArgs extends Omit<DeployOptions, 'from'> {
  hre: HardhatRuntimeEnvironment
  name?: string
  libraries?: Libraries
  log?: boolean
  indent?: number
}

export interface DeployArgs extends CommonDeployArgs {
  contract: string
  args?: any[]
  skipIfAlreadyDeployed?: boolean
  mock?: boolean
}

export const deploy = async <C extends Contract>(
  args: DeployArgs
): Promise<C> => {
  const { hre, skipIfAlreadyDeployed = true, indent = 1 } = args
  const {
    deployments: { deploy, getOrNull },
    getNamedAccounts,
    ethers,
  } = hre

  const log = args.log === false ? (...args: any[]) => {} : args.hre.log

  const { deployer } = await getNamedAccounts()
  const contractDeployName = args.name ?? args.contract
  const existingContract = await getOrNull(contractDeployName)
  let contractAddress: string

  if (!existingContract || (existingContract && !skipIfAlreadyDeployed)) {
    // If marked as mock, prepend "Mock" to the contract name
    const contractName = `${args.contract}${args.mock ? 'Mock' : ''}`

    const result = await deploy(contractDeployName, {
      contract: contractName,
      libraries: args.libraries,
      from: deployer,
      gasLimit: ethers.utils.hexlify(9500000),
      args: args.args,
    })

    contractAddress = result.address
    await onDeployResult({ result, hre, indent })
  } else {
    contractAddress = existingContract.address
    await onDeployResult({
      result: { ...existingContract, newlyDeployed: false },
      hre,
      indent,
    })
  }

  return (await ethers.getContractAt(args.contract, contractAddress)) as C
}

interface DiamondExecuteArgs<F, A> {
  methodName: F
  args: A
}

type Facets = Array<string | Omit<DeployArgs, 'hre'>>

export interface DeployDiamondArgs<
  C extends Contract,
  F = string | undefined,
  A = F extends string ? Parameters<C[F]> : never[]
> extends CommonDeployArgs {
  name: string
  facets: Facets
  owner?: string
  execute?: F extends string ? DiamondExecuteArgs<F, A> : undefined
}

export const deployDiamond = async <
  C extends Contract,
  F = string | undefined,
  A = F extends string ? Parameters<C[F]> : undefined
>(
  args: DeployDiamondArgs<C, F, A>
): Promise<C> => {
  const { hre, indent = 1 } = args
  const {
    deployments: { diamond },
    getNamedAccounts,
    ethers,
    log,
  } = hre

  const { deployer } = await getNamedAccounts()

  const contractDisplayName = colors.bold(
    colors.underline(colors.green(args.name))
  )
  log(`Deploying Diamond facets for ${contractDisplayName}`, {
    star: true,
    indent,
  })

  const result = await diamond.deploy(args.name, {
    owner: args.owner ?? deployer,
    libraries: args.libraries,
    facets: args.facets,
    onFacetDeployment: (result) =>
      onDeployResult({ result, hre, indent: indent + 1 }),
    // @ts-expect-error fix type
    execute: args.execute,
    from: deployer,
    log: false,
  })

  await onDeployResult({
    result,
    hre,
    name: `(Diamond) ${contractDisplayName}`,
    indent: indent + 1,
  })
  log('')

  return (await ethers.getContractAt(result.abi, result.address)) as C
}

interface DeployResultArgs {
  result: DeployResult
  hre: HardhatRuntimeEnvironment
  name?: string
  indent?: number
}

const onDeployResult = async (args: DeployResultArgs): Promise<void> => {
  const { result, hre, name, indent = 1 } = args

  const displayName =
    name ??
    colors.bold(
      colors.underline(colors.green(result.artifactName ?? 'Unknown'))
    )
  hre.log(`${displayName}:`, {
    indent,
    star: true,
    nl: false,
  })

  if (result.newlyDeployed) {
    const gas = colors.cyan(`${result.receipt!.gasUsed} gas`)
    hre.log(
      ` ${colors.green('new')} ${result.address} ${
        result.receipt ? 'with ' + gas : ''
      }`
    )

    await saveDeploymentBlock(hre.network.name, result.receipt!.blockNumber)
  } else {
    hre.log(` ${colors.yellow('reusing')} ${result.address}`)
  }
}

const saveDeploymentBlock = async (
  networkName: string,
  block: number
): Promise<void> => {
  if (networkName === 'hardhat') return

  const disklet = makeNodeDisklet('.')

  const deploymentBlockPath = `deployments/${networkName}/.latestDeploymentBlock`
  const lastDeployment = await disklet
    .getText(deploymentBlockPath)
    .catch(() => {})
  if (!lastDeployment || block > parseInt(lastDeployment)) {
    await disklet.setText(deploymentBlockPath, block.toString())
  }
}
