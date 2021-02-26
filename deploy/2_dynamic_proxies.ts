import { DeployFunction } from 'hardhat-deploy/dist/types'
import { deployDynamicProxy } from '../utils/deploy-helpers'

const deployDynamicProxies: DeployFunction = async (hre) => {
  const proxyContracts = ['Uniswap', 'Compound']

  for (const contract of proxyContracts) {
    await deployDynamicProxy({
      hre,
      contract,
    })
  }
}

export default deployDynamicProxies

deployDynamicProxies.tags = ['dynamic-proxies']
deployDynamicProxies.dependencies = ['settings']
