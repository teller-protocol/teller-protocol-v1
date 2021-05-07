import colors from 'colors'
import { makeNodeDisklet } from 'disklet'
import { Contract } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Libraries } from 'hardhat-deploy/types'

interface CommonDeployArgs {
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
  const {
    hre: {
      deployments: { deploy, getOrNull },
      getNamedAccounts,
      ethers,
    },
    skipIfAlreadyDeployed = true,
    indent = 1,
  } = args

  const log = args.log === false ? (...args: any[]) => {} : args.hre.log

  const { deployer } = await getNamedAccounts()

  const contractDeployName = args.name ?? args.contract
  const existingContract = await getOrNull(contractDeployName)
  let contractAddress: string

  const contractDisplayName = colors.bold(
    colors.underline(colors.green(contractDeployName))
  )
  log(`Deploying ${contractDisplayName}...:`, {
    indent,
    star: true,
    nl: false,
  })

  if (!existingContract || (existingContract && !skipIfAlreadyDeployed)) {
    // If marked as mock, prepend "Mock" to the contract name
    const contractName = `${args.contract}${args.mock ? 'Mock' : ''}`

    const { address, receipt, newlyDeployed } = await deploy(
      contractDeployName,
      {
        contract: contractName,
        libraries: args.libraries,
        from: deployer,
        gasLimit: ethers.utils.hexlify(9500000),
        args: args.args,
      }
    )

    contractAddress = address

    if (newlyDeployed) {
      const gas = colors.cyan(`${receipt!.gasUsed} gas`)
      log(` ${colors.green('new')} ${address} ${receipt ? 'with ' + gas : ''}`)

      await saveDeploymentBlock(args.hre.network.name, receipt!.blockNumber)
    } else {
      log(` ${colors.yellow('reusing')} ${address}`)
    }
  } else {
    contractAddress = existingContract.address
    log(` ${colors.yellow('reusing')} ${existingContract.address}`)
  }

  return (await ethers.getContractAt(args.contract, contractAddress)) as C
}

interface DiamondExecuteArgs<F, A> {
  methodName: F
  args: A
}

type Facets =
  | string[]
  | Array<{
      contract: string
      skipIfAlreadyDeploy?: boolean
    }>

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

  const facetNames: string[] = []
  for (const facet of args.facets) {
    let contractName: string
    let skipIfAlreadyDeployed = true
    if (typeof facet === 'string') {
      contractName = facet
    } else {
      contractName = facet.contract
      skipIfAlreadyDeployed = facet.skipIfAlreadyDeploy ?? skipIfAlreadyDeployed
    }
    facetNames.push(contractName)

    await deploy({
      hre: args.hre,
      contract: contractName,
      log: args.log,
      indent: indent + 1,
      skipIfAlreadyDeployed,
    })
  }

  log(`Deploying ${contractDisplayName} (Diamond)...:`, {
    star: true,
    indent,
    nl: false,
  })

  const { address, abi, receipt, newlyDeployed } = await diamond.deploy(
    args.name,
    {
      owner: args.owner ?? deployer,
      libraries: args.libraries,
      facets: facetNames,
      // @ts-expect-error fix type
      execute: args.execute,
      from: deployer,
      log: false,
    }
  )

  if (newlyDeployed) {
    const gas = colors.cyan(`${receipt!.gasUsed} gas`)
    log(` ${colors.green('new')} ${address} ${receipt ? 'with ' + gas : ''}`)

    await saveDeploymentBlock(hre.network.name, receipt!.blockNumber)
  } else {
    log(` ${colors.yellow('reusing')} ${address}`)
  }

  log('')

  return (await ethers.getContractAt(abi, address)) as C
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
