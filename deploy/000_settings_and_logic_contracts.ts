import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { LogicVersionsRegistry } from '../types/typechain'
import envConfig from '../config'
import { logicNames } from '../test-old/utils/logicNames'
import { EnvConfig } from '../test-old/types'
import { deployLogic, deploySettings } from '../utils/deployHelpers'

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const {
    deployments: { execute, log, read, deploy },
    getNamedAccounts,
    network,
    ethers
  } = hre
  const { deployer } = await getNamedAccounts()
  const env = envConfig(network.name) as EnvConfig
  console.log(network.name, env.networkConfig.compound.CETH)

  const { address: loanLibAddress } = await deploy('LoanLib', { from: deployer })

  const etherCollateralLoansLogic = await deployLogic({ hre, contract: 'EtherCollateralLoans', libraries: { LoanLib: loanLibAddress } })
  const tokenCollateralLoansLogic = await deployLogic({ hre, contract: 'TokenCollateralLoans', libraries: { LoanLib: loanLibAddress } })
  const assetSettingsLogic = await deployLogic({ hre, contract: 'AssetSettings' })
  const chainlinkAggregatorLogic = await deployLogic({ hre, contract: 'ChainlinkAggregator' })
  const ttokenLogic = await deployLogic({ hre, contract: 'TToken' })
  const lendingPoolLogic = await deployLogic({ hre, contract: 'LendingPool' })
  const loanTermsConsensusLogic = await deployLogic({ hre, contract: 'LoanTermsConsensus' })
  const escrowLogic = await deployLogic({ hre, contract: 'Escrow' })
  const escrowFactoryLogic = await deployLogic({ hre, contract: 'EscrowFactory' })
  const marketFactoryLogic = await deployLogic({ hre, contract: 'MarketFactory' })
  const uniswapLogic = await deployLogic({ hre, contract: 'Uniswap' })
  const compoundLogic = await deployLogic({ hre, contract: 'Compound' })
  const settingsLogic = await deployLogic({ hre, contract: 'Settings' })

  const settings = await deploySettings({
    hre,
    logicAddress: settingsLogic.address
  })

  const logicVersionsRegistry = await ethers.getContractAt(
    'LogicVersionsRegistry',
    await settings.versionsRegistry()
  ) as LogicVersionsRegistry
  console.log(logicVersionsRegistry.address)

  const createLogicVersionRequests = [
    { logicName: logicNames.TokenCollateralLoans, logic: tokenCollateralLoansLogic.address },
    { logicName: logicNames.EtherCollateralLoans, logic: etherCollateralLoansLogic.address },
    { logicName: logicNames.TToken, logic: ttokenLogic.address },
    { logicName: logicNames.LendingPool, logic: lendingPoolLogic.address },
    { logicName: logicNames.LoanTermsConsensus, logic: loanTermsConsensusLogic.address },
    { logicName: logicNames.Escrow, logic: escrowLogic.address },
    { logicName: logicNames.ChainlinkAggregator, logic: chainlinkAggregatorLogic.address },
    { logicName: logicNames.Uniswap, logic: uniswapLogic.address },
    { logicName: logicNames.Compound, logic: compoundLogic.address },
    { logicName: logicNames.EscrowFactory, logic: escrowFactoryLogic.address },
    { logicName: logicNames.MarketFactory, logic: marketFactoryLogic.address }
  ]
  await logicVersionsRegistry.createLogicVersions(createLogicVersionRequests)

  await settings.postLogicVersionsRegistered()
}

export default func
func.tags = [ 'test', 'live', 'settings', 'debug' ]
