import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, log, read, get, deploy },
    getNamedAccounts,
    ethers,
  } = hre
  const { deployer } = await getNamedAccounts()

  await deploy('Settings_Proxy', { from: deployer, contract: 'UpgradeableProxy' })
  await deploy('LogicVersionsRegistry_Proxy', {
    from: deployer,
    contract: 'UpgradeableProxy',
  })

  await deploy('ChainlinkAggregator_Proxy', {
    from: deployer,
    contract: 'InitializeableDynamicProxy',
  })
  await deploy('EscrowFactory_Proxy', {
    from: deployer,
    contract: 'InitializeableDynamicProxy',
  })
  await deploy('ATMSettings_Proxy', { from: deployer, contract: 'InitializeableDynamicProxy' })
  await deploy('ATMFactory_Proxy', { from: deployer, contract: 'InitializeableDynamicProxy' })
  await deploy('MarketFactory_Proxy', {
    from: deployer,
    contract: 'InitializeableDynamicProxy',
  })
}

export default func
func.tags = ['test', 'live']
