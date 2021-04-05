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
    },
  } = args

  const { deployer } = await getNamedAccounts()

  process.stdout.write(` * Deploying ${args.name}...: `)

  const { abi, address, receipt, newlyDeployed } = await deploy(args.name, {
    owner: args.owner ?? deployer,
    libraries: args.libraries,
    facets: args.facets,
    execute: args.execute,
    from: deployer,
  })
  if (newlyDeployed) {
    process.stdout.write(
      `${address} ${receipt ? `with ${receipt.gasUsed} gas` : ''} \n`
    )
  } else {
    process.stdout.write(` already deployed ${address} \n`)
  }

  return (await ethers.getContractAt(abi, address)) as C
}
