import { randomBytes } from 'crypto'
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
}

export const deployDiamond = async <C extends Contract>(
  args: DeployArgs
): Promise<C> => {
  const {
    hre: {
      deployments: {
        diamond: { deploy },
        getOrNull,
      },
      getNamedAccounts,
      ethers,
    },
  } = args

  const { deployer } = await getNamedAccounts()

  const existingContract = await getOrNull(args.name)
  let contractAddress: string

  if (!existingContract) {
    // If marked as mock, prepend "Mock" to the contract name
    const contractName = `${args.name}${args.mock ? 'Mock' : ''}`

    process.stdout.write(` * Deploying ${args.name}...: `)

    const { address, receipt } = await deploy(args.name, {
      deterministicSalt: randomBytes(32).toString('hex'),
      facets: args.facets,
      libraries: args.libraries,
      from: deployer,
      gasLimit: ethers.utils.hexlify(9500000),
      owner: args.owner ?? deployer,
    })

    contractAddress = address
    process.stdout.write(
      `${address} ${receipt ? `with ${receipt.gasUsed} gas` : ''} \n`
    )
  } else {
    contractAddress = existingContract.address
    process.stdout.write(
      ` * Reusing ${args.name} deployment at ${existingContract.address} \n`
    )
  }

  return (await ethers.getContractAt(args.name, contractAddress)) as C
}
