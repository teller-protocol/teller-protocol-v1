import * as ethers from 'ethers'

export const logicNames = {
  TToken: ethers.utils.id('TToken'),
  LendingPool: ethers.utils.id('LendingPool'),
  TokenCollateralLoans: ethers.utils.id('TokenCollateralLoans'),
  EtherCollateralLoans: ethers.utils.id('EtherCollateralLoans'),
  LoanTermsConsensus: ethers.utils.id('LoanTermsConsensus'),
  EscrowFactory: ethers.utils.id('EscrowFactory'),
  Escrow: ethers.utils.id('Escrow'),
  ChainlinkAggregator: ethers.utils.id('ChainlinkAggregator'),
  Settings: ethers.utils.id('Settings'),
  LogicVersionsRegistry: ethers.utils.id('LogicVersionsRegistry'),
  ATMFactory: ethers.utils.id('ATMFactory'),
  ATMSettings: ethers.utils.id('ATMSettings'),
  ATMGovernance: ethers.utils.id('ATMGovernance'),
  TLRToken: ethers.utils.id('TLRToken'),
  ATMLiquidityMining: ethers.utils.id('ATMLiquidityMining'),
  MarketFactory: ethers.utils.id('MarketFactory'),
  Uniswap: ethers.utils.id('Uniswap'),
  Compound: ethers.utils.id('Compound'),
}
