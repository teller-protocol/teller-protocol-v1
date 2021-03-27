import { DeployFunction } from 'hardhat-deploy/types'

import { DappRegistry } from '../types/typechain/DappRegistry'
import { deployDynamicProxy } from '../utils/deploy-helpers'

type DappDeploymentData = Array<{
  contract: string
  unsecured: boolean
}>

const deployDapps: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts } = hre
  const { deployer } = await getNamedAccounts()

  const dappData: DappDeploymentData = [
    {
      contract: 'UniswapDapp',
      unsecured: false,
    },
    {
      contract: 'CompoundDapp',
      unsecured: true,
    },
    {
      contract: 'AaveDapp',
      unsecured: true,
    },
    {
      contract: 'YearnDapp',
      unsecured: true,
    },
    {
      contract: 'PoolTogetherDapp',
      unsecured: true,
    },
  ]
  const dappRegistry = await contracts.get<DappRegistry>('DappRegistry', {
    from: deployer,
  })

  for (const data of dappData) {
    const { address } = await deployDynamicProxy({
      hre,
      contract: data.contract,
      strictDynamic: false,
    })
    await dappRegistry.addDapp(address, data.unsecured)
  }
}

export default deployDapps

deployDapps.tags = ['dapps']
deployDapps.dependencies = ['settings']
