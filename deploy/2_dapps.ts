import { DeployFunction } from 'hardhat-deploy/types'

import { DappRegistry } from '../types/typechain/DappRegistry'
import { deployDynamicProxy } from '../utils/deploy-helpers'

type DappDeploymentData = Array<{
  contract: string
  unsecured: boolean
}>

const deployDynamicProxies: DeployFunction = async (hre) => {
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

export default deployDynamicProxies

deployDynamicProxies.tags = ['dapps']
deployDynamicProxies.dependencies = ['settings']
