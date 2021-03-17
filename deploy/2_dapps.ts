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
      contract: 'Uniswap',
      unsecured: false,
    },
    {
      contract: 'Compound',
      unsecured: true,
    },
    {
      contract: 'Aave',
      unsecured: true,
    },
    {
      contract: 'Yearn',
      unsecured: true,
    },
    {
      contract: 'PoolTogether',
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
    })
    await dappRegistry.addDapp(address, data.unsecured)
  }
}

export default deployDapps

deployDapps.tags = ['dapps']
deployDapps.dependencies = ['settings']
