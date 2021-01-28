import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { logicNames } from '../test/utils/logicNames'
import { NULL_ADDRESS } from '../test/utils/consts'

import envConfig from '../config'
import {
  ATMSettings,
  ChainlinkAggregator,
  EscrowFactory,
  InitializeableDynamicProxy,
  LogicVersionsRegistry,
  MarketFactory,
  Settings,
  UpgradeableProxy,
} from '../typechain'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, log, read, get, deploy, all, rawTx },
    getNamedAccounts,
    network,
    ethers,
  } = hre

  const env = envConfig(network.name)

  const { deployer } = await getNamedAccounts()

  console.log(Object.entries(await all()).reduce((acc, curr) => ({ ...acc, [curr[0]]: curr[1].address }), {}))

  const settings_LogicDeployment = await get('Settings_Logic')
  const logicVersionsRegistry_LogicDeploment = await get('LogicVersionsRegistry_Logic')

  const settings_ProxyDeployment = await get('Settings_Proxy')
  const logicVersionsRegistry_ProxyDeployment = await get('LogicVersionsRegistry_Proxy')
  const chainlinkAggregator_ProxyDeployment = await get('ChainlinkAggregator_Proxy')
  const atmSettings_ProxyDeployment = await get('ATMSettings_Proxy')
  const escrowFactory_ProxyDeployment = await get('EscrowFactory_Proxy')
  const marketFactory_ProxyDeployment = await get('MarketFactory_Proxy')

  const settings_Proxy = (await ethers.getContractAt('UpgradeableProxy', settings_ProxyDeployment.address)) as UpgradeableProxy
  const logicVersionsRegistry_Proxy = (await ethers.getContractAt(
    'UpgradeableProxy',
    logicVersionsRegistry_ProxyDeployment.address
  )) as UpgradeableProxy

  const chainlinkAggregator_Proxy = (await ethers.getContractAt(
    'InitializeableDynamicProxy',
    chainlinkAggregator_ProxyDeployment.address
  )) as InitializeableDynamicProxy
  const atmSettings_Proxy = (await ethers.getContractAt(
    'InitializeableDynamicProxy',
    atmSettings_ProxyDeployment.address
  )) as InitializeableDynamicProxy
  const escrowFactory_Proxy = (await ethers.getContractAt(
    'InitializeableDynamicProxy',
    escrowFactory_ProxyDeployment.address
  )) as InitializeableDynamicProxy
  const marketFactory_Proxy = (await ethers.getContractAt(
    'InitializeableDynamicProxy',
    marketFactory_ProxyDeployment.address
  )) as InitializeableDynamicProxy

  const settings = (await ethers.getContractAt('Settings', settings_ProxyDeployment.address)) as Settings
  const logicVersionsRegistry = (await ethers.getContractAt(
    'LogicVersionsRegistry',
    logicVersionsRegistry_ProxyDeployment.address
  )) as LogicVersionsRegistry
  const chainlinkAggregator = (await ethers.getContractAt(
    'ChainlinkAggregator',
    chainlinkAggregator_ProxyDeployment.address
  )) as ChainlinkAggregator
  const atmSettings = (await ethers.getContractAt('ATMSettings', atmSettings_ProxyDeployment.address)) as ATMSettings
  const escrowFactory = (await ethers.getContractAt('EscrowFactory', escrowFactory_ProxyDeployment.address)) as EscrowFactory
  const marketFactory = (await ethers.getContractAt('MarketFactory', marketFactory_ProxyDeployment.address)) as MarketFactory

  await settings_Proxy.initializeProxy(settings_ProxyDeployment.address, settings_LogicDeployment.address)
  await logicVersionsRegistry_Proxy.initializeProxy(
    settings_ProxyDeployment.address,
    logicVersionsRegistry_LogicDeploment.address
  )
  await logicVersionsRegistry.initialize(settings_ProxyDeployment.address)
  await settings['initialize(address,address,address,address,address,address,address)'](
    escrowFactory_ProxyDeployment.address,
    logicVersionsRegistry_ProxyDeployment.address,
    chainlinkAggregator_ProxyDeployment.address,
    NULL_ADDRESS,
    atmSettings_ProxyDeployment.address,
    network.live ? env.networkConfig.tokens.WETH : (await deploy('WETHMock', { from: deployer })).address, // tokens.WETH,
    network.live ? env.networkConfig.compound.CETH : (await deploy('WETHMock', { from: deployer })).address // compound.CETH
  )

  const createLogicVersionRequests = [
    { logicName: logicNames.TLRToken, logic: (await get('TLRToken')).address },
    { logicName: logicNames.TokenCollateralLoans, logic: (await get('TokenCollateralLoans')).address },
    { logicName: logicNames.EtherCollateralLoans, logic: (await get('EtherCollateralLoans')).address },
    { logicName: logicNames.LendingPool, logic: (await get('LendingPool_Logic')).address },
    { logicName: logicNames.LoanTermsConsensus, logic: (await get('LoanTermsConsensus_Logic')).address },
    { logicName: logicNames.Escrow, logic: (await get('Escrow_Logic')).address },
    { logicName: logicNames.ChainlinkAggregator, logic: (await get('ChainlinkAggregator_Logic')).address },
    { logicName: logicNames.ATMGovernance, logic: (await get('ATMGovernance_Logic')).address },
    { logicName: logicNames.ATMLiquidityMining, logic: (await get('ATMLiquidityMining_Logic')).address },
    { logicName: logicNames.Uniswap, logic: (await get('Uniswap_Logic')).address },
    { logicName: logicNames.Compound, logic: (await get('Compound_Logic')).address },
    { logicName: logicNames.EscrowFactory, logic: (await get('EscrowFactory_Logic')).address },
    { logicName: logicNames.ATMSettings, logic: (await get('ATMSettings_Logic')).address },
    { logicName: logicNames.ATMFactory, logic: (await get('ATMFactory_Logic')).address },
    { logicName: logicNames.MarketFactory, logic: (await get('MarketFactory_Logic')).address },
  ]

  await logicVersionsRegistry.createLogicVersions(createLogicVersionRequests)

  await chainlinkAggregator_Proxy.initializeProxy(settings_ProxyDeployment.address, logicNames.ChainlinkAggregator)
  await atmSettings_Proxy.initializeProxy(settings_ProxyDeployment.address, logicNames.ATMSettings)
  await escrowFactory_Proxy.initializeProxy(settings_ProxyDeployment.address, logicNames.EscrowFactory)
  await marketFactory_Proxy.initializeProxy(settings_ProxyDeployment.address, logicNames.MarketFactory)

  await chainlinkAggregator.initialize(settings_ProxyDeployment.address)
  await atmSettings.initialize(settings_ProxyDeployment.address)
  await escrowFactory.initialize(settings_ProxyDeployment.address)
  await marketFactory.initialize(settings_ProxyDeployment.address)
}

export default func
func.tags = ['test', 'live']
