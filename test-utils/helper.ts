import { Contract } from 'ethers'
import { ethers, network } from 'hardhat'
import { task } from 'hardhat/config'
import { send } from 'process'
import {
  LogicVersionsRegistry,
  Settings,
  Settings__factory,
  Uniswap,
  Compound,
  Loans,
  LendingPool,
  LoanTermsConsensus,
  TToken,
  EscrowFactory__factory,
  MarketFactory,
  ChainlinkAggregator,
  EscrowFactory,
  UpgradeableProxy,
  LoanLib,
  AssetSettings,
} from '../typechain'

// Interface of contract tied to proxy address
export type Contracts = Partial<{
  settings: Settings
  logicVersionsRegistry: LogicVersionsRegistry
  uniswap: Uniswap
  compound: Compound
  escrowFactory: EscrowFactory
  marketFactory: MarketFactory
  chainlinkAggregator: ChainlinkAggregator
  loans: {
    ETH_DAI: Loans
  }
  lendingPool: {
    ETH_DAI: LendingPool
  }
  loanTermsConsensus: {
    ETH_DAI: LoanTermsConsensus
  }
  tToken: {
    TDAI: TToken
  }
}>

export class SettingsTestHelper {
  constructor(public contracts: Contracts, public addresses: string[]) {}

  public async updatePlatformSetting(settingName: any, newValue: number, senderAddress = this.addresses[0]) {
    if (!this.contracts.settings) throw 'No settings contract deployed'
    await this.contracts.settings.connect(senderAddress).updatePlatformSetting(settingName, newValue)
  }

  public async removePlatformSetting(settingName: any, senderAddress = this.addresses[0]) {
    if (!this.contracts.settings) throw 'No settings contract deployed'
    await this.contracts.settings.connect(senderAddress).removePlatformSetting(settingName)
  }

  public async addPauser(pauserAddress: string, senderAddress = this.addresses[0]) {
    if (!this.contracts.settings) throw 'No settings contract deployed'
    await this.contracts.settings.connect(senderAddress).addPauser(pauserAddress)
  }

  public async pauseLendingPool(lendingPoolAddress: string, senderAddress = this.addresses[0]) {
    if (!this.contracts.settings) throw 'No settings contract deployed'
    await this.contracts.settings.connect(senderAddress).pauseLendingPool(lendingPoolAddress)
  }

  public async unpauseLendingPool(lendingPoolAddress: string, senderAddress = this.addresses[0]) {
    if (!this.contracts.settings) throw 'No settings contract deployed'
    await this.contracts.settings.connect(senderAddress).unpauseLendingPool(lendingPoolAddress)
  }

  public async updateMaxAmountSetting(assetSettingsAddress: string, newMaxLoanAmount: number, senderAddress = this.addresses[0]) {
    if (!this.contracts.settings) throw 'No settings contract deployed'
    const assetSettings = await load<AssetSettings>('AssetSettings', await this.contracts.settings.assetSettings())
    await assetSettings.connect(senderAddress).updateMaxLoanAmount(assetSettingsAddress, newMaxLoanAmount)
  }

  public async updateCTokenAddressSetting(
    assetSettingsAddress: string,
    newCTokenAddress: string,
    senderAddress = this.addresses[0]
  ) {
    if (!this.contracts.settings) throw 'No settings contract deployed'
    const assetSettings = await load<AssetSettings>('AssetSettings', await this.contracts.settings.assetSettings())
    await assetSettings.connect(senderAddress).updateCTokenAddress(assetSettingsAddress, newCTokenAddress)
  }

  public async updateMaxTVLSetting(assetSettingsAddress: string, newMaxTVLAmount: number, senderAddress = this.addresses[0]) {
    if (!this.contracts.settings) throw 'No settings contract deployed'
    const assetSettings = await load<AssetSettings>('AssetSettings', await this.contracts.settings.assetSettings())
    await assetSettings.connect(senderAddress).updateMaxTVL(assetSettingsAddress, newMaxTVLAmount)
  }
}

async function load<C extends Contract>(contractName: string, address: string): Promise<C> {
  const factory = await ethers.getContractFactory(contractName)
  const contract = factory.attach(address) as C
  return contract
}
export class LoansTestHelper {
  constructor(public contracts: Contracts, public addresses: string[]) {}

  public async createLoanWithTerms(
    request: Parameters<Loans['createLoanWithTerms']>[0],
    responses: Parameters<Loans['createLoanWithTerms']>[1],
    collateralAmount: number,
    senderAddress = this.addresses[0]
  ) {
    if (!this.contracts.loans?.ETH_DAI) throw 'No loans contract deployed'
    await this.contracts.loans?.ETH_DAI.connect(senderAddress).createLoanWithTerms(request, responses, collateralAmount)
  }

  public async depositCollateral(
    borrowerAddress: string,
    amountToDeposit: number,
    loanID: number,
    senderAddress = this.addresses[0]
  ) {
    if (!this.contracts.loans?.ETH_DAI) throw 'No loans contract deployed'
    await this.contracts.loans?.ETH_DAI.connect(senderAddress).depositCollateral(borrowerAddress, amountToDeposit, loanID)
  }

  public async takeOutLoan(loanID: number, amountToBorrow: number, senderAddress = this.addresses[0]) {
    if (!this.contracts.loans?.ETH_DAI) throw 'No loans contract deployed'
    await this.contracts.loans?.ETH_DAI.connect(senderAddress).takeOutLoan(loanID, amountToBorrow)
  }

  public async withdrawCollateral(amountToWithdraw: number, loanID: number, senderAddress = this.addresses[0]) {
    if (!this.contracts.loans?.ETH_DAI) throw 'No loans contract deployed'
    await this.contracts.loans?.ETH_DAI.connect(senderAddress).withdrawCollateral(amountToWithdraw, loanID)
  }

  public async repay(amountToRepay: number, loanID: number, senderAddress = this.addresses[0]) {
    if (!this.contracts.loans?.ETH_DAI) throw 'No loans contract deployed'
    await this.contracts.loans?.ETH_DAI.connect(senderAddress).repay(amountToRepay, loanID)
  }

  public async liquidateLoan(loanID: number, senderAddress = this.addresses[0]) {
    if (!this.contracts.loans?.ETH_DAI) throw 'No loans contract deployed'
    await this.contracts.loans?.ETH_DAI.connect(senderAddress).liquidateLoan(loanID)
  }
}

export class LendingPoolTestHelper {
  constructor(public contracts: Contracts, public addresses: string[]) {}

  public async deposit(amountToDeposit: number, senderAddress = this.addresses[0]) {
    if (!this.contracts.lendingPool?.ETH_DAI) throw 'No lending pool contract deployed'
    await this.contracts.lendingPool?.ETH_DAI.connect(senderAddress).deposit(amountToDeposit)
  }

  public async withdraw(amountToWithdraw: number, senderAddress = this.addresses[0]) {
    if (!this.contracts.lendingPool?.ETH_DAI) throw 'No lending pool contract deployed'
    await this.contracts.lendingPool?.ETH_DAI.connect(senderAddress).withdraw(amountToWithdraw)
  }

  public async withdrawAll(senderAddress = this.addresses[0]) {
    if (!this.contracts.lendingPool?.ETH_DAI) throw 'No lending pool contract deployed'
    await this.contracts.lendingPool?.ETH_DAI.connect(senderAddress).withdrawAll()
  }

  public async balanceOfUnderlying(lenderAddress: string) {
    if (!this.contracts.lendingPool?.ETH_DAI) throw 'No lending pool contract deployed'
    return await this.contracts.lendingPool?.ETH_DAI.balanceOfUnderlying(lenderAddress)
  }

  public async getLenderInterestEarned(lenderAddress: string) {
    if (!this.contracts.lendingPool?.ETH_DAI) throw 'No lending pool contract deployed'
    return await this.contracts.lendingPool?.ETH_DAI.getLenderInterestEarned(lenderAddress)
  }

  public async getDebtRatioFor(loanAmount: number) {
    if (!this.contracts.lendingPool?.ETH_DAI) throw 'No lending pool contract deployed'
    return await this.contracts.lendingPool?.ETH_DAI.getDebtRatioFor(loanAmount)
  }

  public async exchangeRate() {
    if (!this.contracts.lendingPool?.ETH_DAI) throw 'No lending pool contract deployed'
    return await this.contracts.lendingPool?.ETH_DAI.exchangeRate()
  }
}

export class MarketFactoryTestHelper {
  constructor(public contracts: Contracts, public addresses: string[]) {}

  public async createMarket(lendingTokenAddress: string, collateralTokenAddress: string, senderAddress = this.addresses[0]) {
    if (!this.contracts.marketFactory) throw 'No market factory contract deployed'
    await this.contracts.marketFactory.connect(senderAddress).createMarket(lendingTokenAddress, collateralTokenAddress)
  }

  public async removeMarket(lendingTokenAddress: string, collateralTokenAddress: string, senderAddress = this.addresses[0]) {
    if (!this.contracts.marketFactory) throw 'No market factory contract deployed'
    await this.contracts.marketFactory.connect(senderAddress).removeMarket(lendingTokenAddress, collateralTokenAddress)
  }
}

export class CompoundTestHelper {
  constructor(public contracts: Contracts, public addresses: string[]) {}

  public async lend(tokenAddress: string, amountToLend: string, senderAddress = this.addresses[0]) {
    if (!this.contracts.compound) throw 'No compound contract deployed'
    await this.contracts.compound.connect(senderAddress).lend(tokenAddress, amountToLend)
  }

  public async redeem(tokenAddress: string, amountToRedeem: string, senderAddress = this.addresses[0]) {
    if (!this.contracts.compound) throw 'No compound contract deployed'
    await this.contracts.compound.connect(senderAddress).redeem(tokenAddress, amountToRedeem)
  }
}

export class UniswapTestHelper {
  constructor(public contracts: Contracts, public addresses: string[]) {}

  public async swap(path: string[], sourceAmount: number, minDestination: number, senderAddress = this.addresses[0]) {
    if (!this.contracts.uniswap) throw 'No uniswap contract deployed'
    await this.contracts.uniswap.connect(senderAddress).swap(path, sourceAmount, minDestination)
  }
}

export class TestHelper {
  public settingsHelper: SettingsTestHelper
  public loansHelper: LoansTestHelper
  public lendingPoolHelper: LendingPoolTestHelper
  public marketFactoryHelper: MarketFactoryTestHelper
  public compoundHelper: CompoundTestHelper
  public uniswapHelper: UniswapTestHelper

  constructor(public contracts: Contracts, public accounts: string[]) {
    this.settingsHelper = new SettingsTestHelper(contracts, accounts)
    this.loansHelper = new LoansTestHelper(contracts, accounts)
    this.lendingPoolHelper = new LendingPoolTestHelper(contracts, accounts)
    this.marketFactoryHelper = new MarketFactoryTestHelper(contracts, accounts)
    this.compoundHelper = new CompoundTestHelper(contracts, accounts)
    this.uniswapHelper = new UniswapTestHelper(contracts, accounts)
  }

  public async advanceBlockTimestamp(blockTimestampTo: number) {
    await network.provider.send('evm_setNextBlockTimestamp', [blockTimestampTo])
    await network.provider.send('evm_mine')
  }
}
