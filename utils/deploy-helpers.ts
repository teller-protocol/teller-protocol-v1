import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Libraries } from 'hardhat-deploy/types'
import { Contract } from 'ethers'

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
