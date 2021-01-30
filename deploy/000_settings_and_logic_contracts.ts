import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { LogicVersionsRegistry, Settings, UpgradeableProxy } from '../typechain'
import envConfig from '../config'
import { logicNames } from '../test/utils/logicNames'
import { EnvConfig } from '../test/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, log, read, deploy },
    getNamedAccounts,
    network,
    ethers,
  } = hre
  const { deployer } = await getNamedAccounts()
  const env = envConfig(network.name) as EnvConfig
  console.log(network.name, env.networkConfig.compound.CETH)

  // Contracts without proxy
  const loanLib = await deploy('LoanLib', { from: deployer })
  const { address: tokenCollateralLoansLogicAddress } = await deploy('TokenCollateralLoans', {
    from: deployer,
    libraries: { LoanLib: loanLib.address },
  })
  const { address: etherCollateralLoansLogicAddress } = await deploy('EtherCollateralLoans', {
    from: deployer,
    libraries: { LoanLib: loanLib.address },
  })

  const { address: logicVersionsRegistryLogicAddress } = await deploy('LogicVersionsRegistry_Logic', {
    from: deployer,
    contract: 'LogicVersionsRegistry',
  })

  const { address: assetSettingsLogicAddress } = await deploy('AssetSettings_Logic', {
    from: deployer,
    contract: 'AssetSettings',
    log: true,
  })
  const { address: chainlinkAggregatorLogicAddress } = await deploy('ChainlinkAggregator_Logic', {
    from: deployer,
    contract: 'ChainlinkAggregator',
  })
  const { address: ttokenLogicAddress } = await deploy('TToken_Logic', {
    from: deployer,
    contract: 'TToken',
  })
  const { address: lendingPoolLogicAddress } = await deploy('LendingPool_Logic', {
    from: deployer,
    contract: 'LendingPool',
  })
  const { address: loanTermsConsensusLogicAddress } = await deploy('LoanTermsConsensus_Logic', {
    from: deployer,
    contract: 'LoanTermsConsensus',
  })
  const { address: escrowLogicAddress } = await deploy('Escrow_Logic', {
    from: deployer,
    contract: 'Escrow',
  })
  console.log('PASSING 1')

  // Factories
  const { address: escrowFactoryLogicAddress } = await deploy('EscrowFactory_Logic', {
    from: deployer,
    contract: 'EscrowFactory',
  })
  const { address: marketFactoryLogicAddress } = await deploy('MarketFactory_Logic', {
    from: deployer,
    contract: 'MarketFactory',
  })

  // Dapps
  const { address: uniswapLogicAddress } = await deploy('Uniswap_Logic', {
    from: deployer,
    contract: 'Uniswap',
  })
  const { address: compoundLogicAddress } = await deploy('Compound_Logic', {
    from: deployer,
    contract: 'Compound',
  })

  const { address: settingsLogicAddress } = await deploy('Settings_Logic', {
    from: deployer,
    contract: 'Settings',
  })

  console.log('PASSING 2')

  const { address: settingsAddress } = await deploy('Settings', {
    from: deployer,
    contract: 'UpgradeableProxy',
  })
  const settingsProxy = (await ethers.getContractAt('UpgradeableProxy', settingsAddress)) as UpgradeableProxy
  await settingsProxy.initializeProxy(settingsAddress, settingsLogicAddress)
  const settings = (await ethers.getContractAt('Settings', settingsAddress)) as Settings

  await settings['initialize(address,address,address)'](
    logicVersionsRegistryLogicAddress,
    env.networkConfig.tokens.WETH,
    env.networkConfig.compound.CETH
  )

  const logicVersionsRegistry = (await ethers.getContractAt(
    'LogicVersionsRegistry',
    await settings.versionsRegistry()
  )) as LogicVersionsRegistry
  console.log(logicVersionsRegistry.address)

  const createLogicVersionRequests = [
    { logicName: logicNames.TokenCollateralLoans, logic: tokenCollateralLoansLogicAddress },
    { logicName: logicNames.EtherCollateralLoans, logic: etherCollateralLoansLogicAddress },
    { logicName: logicNames.TToken, logic: ttokenLogicAddress },
    { logicName: logicNames.LendingPool, logic: lendingPoolLogicAddress },
    { logicName: logicNames.LoanTermsConsensus, logic: loanTermsConsensusLogicAddress },
    { logicName: logicNames.Escrow, logic: escrowLogicAddress },
    { logicName: logicNames.ChainlinkAggregator, logic: chainlinkAggregatorLogicAddress },
    { logicName: logicNames.Uniswap, logic: uniswapLogicAddress },
    { logicName: logicNames.Compound, logic: compoundLogicAddress },
    { logicName: logicNames.EscrowFactory, logic: escrowFactoryLogicAddress },
    { logicName: logicNames.MarketFactory, logic: marketFactoryLogicAddress },
  ]

  await logicVersionsRegistry.createLogicVersions(createLogicVersionRequests)

  await settings.postLogicVersionsRegistered()
}

export default func
func.tags = ['test', 'live', 'settings', 'debug']
