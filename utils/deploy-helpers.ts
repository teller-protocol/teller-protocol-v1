import { Contract } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DiamondOptions } from 'hardhat-deploy/dist/types'
import { Libraries } from 'hardhat-deploy/types'

interface CommonDeployArgs {
  hre: HardhatRuntimeEnvironment
  name?: string
  libraries?: Libraries
  log?: boolean
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
  } = args

  const log = args.log === false ? (...args: any[]) => {} : args.hre.log

  const { deployer } = await getNamedAccounts()

  const contractDeployName = args.name ?? args.contract
  const existingContract = await getOrNull(contractDeployName)
  let contractAddress: string

  if (!existingContract || (existingContract && !skipIfAlreadyDeployed)) {
    // If marked as mock, prepend "Mock" to the contract name
    const contractName = `${args.contract}${args.mock ? 'Mock' : ''}`

    log(`Deploying ${contractDeployName}...: `, {
      indent: 1,
      star: true,
      nl: false,
    })

    const { address, receipt } = await deploy(contractDeployName, {
      contract: contractName,
      libraries: args.libraries,
      from: deployer,
      gasLimit: ethers.utils.hexlify(9500000),
      args: args.args,
    })

    contractAddress = address
    log(`${address} ${receipt ? `with ${receipt.gasUsed} gas` : ''}`)
  } else {
    contractAddress = existingContract.address
    log(
      `Reusing ${contractDeployName} deployment at ${existingContract.address}`,
      { indent: 1, star: true }
    )
  }

  return (await ethers.getContractAt(args.contract, contractAddress)) as C
}

interface DiamondExecuteArgs<F, A> {
  methodName: F
  args: A
}

export interface DeployDiamondArgs<
  C extends Contract,
  F = string | undefined,
  A = F extends string ? Parameters<C[F]> : never[]
> extends CommonDeployArgs {
  name: string
  facets: string[]
  owner?: string
  execute?: F extends string
    ? DiamondExecuteArgs<F, A>
    : DiamondOptions['execute']
  upgrade?: F extends string
    ? DiamondExecuteArgs<F, A>
    : DiamondOptions['execute']
}

export const deployDiamond = async <
  C extends Contract,
  F = string | undefined,
  A = F extends string ? Parameters<C[F]> : undefined
>(
  args: DeployDiamondArgs<C, F, A>
): Promise<C> => {
  const {
    hre: {
      deployments: {
        diamond: { deploy },
      },
      getNamedAccounts,
      ethers,
      log,
    },
  } = args

  const { deployer } = await getNamedAccounts()

  log(`Deploying ${args.name}...: `, { star: true, indent: 1, nl: false })

  const deployment = await args.hre.deployments.getOrNull(args.name)
  const executeArgs = deployment ? args.upgrade : args.execute

  const { address, abi, receipt, newlyDeployed } = await deploy(args.name, {
    owner: args.owner ?? deployer,
    libraries: args.libraries,
    facets: args.facets,
    // @ts-expect-error fix type
    execute: executeArgs,
    from: deployer,
    log: false,
  })

  if (newlyDeployed) {
    log(`${address} ${receipt ? `with ${receipt.gasUsed} gas` : ''}`)
  } else {
    log(`already deployed ${address}`)
  }

  return (await ethers.getContractAt(abi, address)) as C
}
