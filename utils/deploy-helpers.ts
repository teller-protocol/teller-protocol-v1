import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Libraries } from 'hardhat-deploy/types'
import { Contract } from 'ethers'

import { UpgradeableProxy } from '../types/typechain'

export interface DeployArgs {
  hre: HardhatRuntimeEnvironment
  contract: string
  name?: string
  libraries?: Libraries
}

export const deploy = async (args: DeployArgs): Promise<Contract> => {
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
  })

  return ethers.getContractAt(args.contract, address)
}

export interface DeployLogicArgs extends Omit<DeployArgs, 'name'> {}

export const deployLogic = async (args: DeployLogicArgs): Promise<void> => {
  await deploy({
    ...args,
    name: `${args.contract}_Logic`,
  })
}

export const deployUpgradeableProxy = async (args: DeployArgs): Promise<UpgradeableProxy> => {
  const {
    hre: { deployments },
  } = args

  const name = `${args.contract}_Proxy`
  const proxy = (await deploy({
    hre: args.hre,
    name,
    contract: 'UpgradeableProxy',
  })) as UpgradeableProxy

  const { abi } = await deployments.getArtifact(args.contract)
  await deployments.save(args.contract, {
    abi,
    address: proxy.address,
  })
  return proxy
}
