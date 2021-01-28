import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, log, read, deploy },
    getNamedAccounts,
    ethers,
  } = hre
  const { deployer } = await getNamedAccounts()

  // Contracts without proxy
  await deploy('TLRToken', { from: deployer })
  const loanLib = await deploy('LoanLib', { from: deployer })
  await deploy('TokenCollateralLoans', { from: deployer, libraries: { LoanLib: loanLib.address } })
  await deploy('EtherCollateralLoans', { from: deployer, libraries: { LoanLib: loanLib.address } })

  await deploy('Settings_Logic', { from: deployer, contract: 'Settings' })
  await deploy('LogicVersionsRegistry_Logic', { from: deployer, contract: 'LogicVersionsRegistry' })

  // await deploy('TToken')
  await deploy('LendingPool_Logic', { from: deployer, contract: 'LendingPool' })
  await deploy('LoanTermsConsensus_Logic', { from: deployer, contract: 'LoanTermsConsensus' })
  await deploy('Escrow_Logic', { from: deployer, contract: 'Escrow' })
  await deploy('ChainlinkAggregator_Logic', { from: deployer, contract: 'ChainlinkAggregator' })
  await deploy('ATMGovernance_Logic', { from: deployer, contract: 'ATMGovernance' })
  await deploy('ATMLiquidityMining_Logic', { from: deployer, contract: 'ATMLiquidityMining' })
  await deploy('Uniswap_Logic', { from: deployer, contract: 'Uniswap' })
  await deploy('Compound_Logic', { from: deployer, contract: 'Compound' })
  await deploy('EscrowFactory_Logic', { from: deployer, contract: 'EscrowFactory' })
  await deploy('ATMSettings_Logic', { from: deployer, contract: 'ATMSettings' })
  await deploy('ATMFactory_Logic', { from: deployer, contract: 'ATMFactory' })
  await deploy('MarketFactory_Logic', { from: deployer, contract: 'MarketFactory' })
}

export default func
func.tags = ['test', 'live']
