import { Contract } from 'ethers'
import { Libraries } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export interface DeployArgs {
  hre: HardhatRuntimeEnvironment
  facets: string[]
  name: string
  libraries?: Libraries
  args?: any[]
  mock?: boolean
  owner?: string
  execute?: {
    methodName: string
    args: any[]
  }
}

export const deployDiamond = async <C extends Contract>(
  args: DeployArgs
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

  const { abi, address, receipt, newlyDeployed } = await deploy(args.name, {
    owner: args.owner ?? deployer,
    libraries: args.libraries,
    facets: args.facets,
    execute: args.execute,
    from: deployer,
    log: false,
  })
  if (newlyDeployed) {
    log(`${address} ${receipt ? `with ${receipt.gasUsed} gas` : ''}`)
  } else {
    log(` already deployed ${address}`)
  }

  return (await ethers.getContractAt(abi, address)) as C
}
