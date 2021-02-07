import { ethers } from 'hardhat';
import { task } from 'hardhat/config';
import {
  Dummy,
  LogicVersionsRegistry,
  Settings,
  Settings__factory,
  Uniswap,
  Compound,
  EtherCollateralLoans,
  LoansBase,
  LendingPool,
  LoanTermsConsensus,
  TToken,
  EscrowFactory__factory,
  MarketFactory,
  ChainlinkAggregator,
  EscrowFactory,
  UpgradeableProxy,
} from '../typechain';

// Interface of contract tied to proxy address
export type Contracts = Partial<{
  settings: Settings;
  logicVersionsRegistry: LogicVersionsRegistry;
  uniswap: Uniswap;
  compound: Compound;
  escrowFactory: EscrowFactory;
  marketFactory: MarketFactory;
  chainlinkAggregator: ChainlinkAggregator;
  loans: {
    ETH_DAI: LoansBase;
  };
  lendingPool: {
    ETH_DAI: LendingPool;
  };
  loanTermsConsensus: {
    ETH_DAI: LoanTermsConsensus;
  };
  tToken: {
    TDAI: TToken;
  };
}>;

export class SettingsTestHelper {
  constructor(public contracts: Contracts) {}

  public async updatePlatformSetting() {
    if (!this.contracts.settings) throw 'No settings contract deployed';
    await this.contracts.settings.updatePlatformSetting();
  }
}

export class LoansTestHelper {
  constructor(public contracts: Contracts) {}
}

export class LendingPoolTestHelper {
  constructor(public contracts: Contracts) {}
}

export class TestHelper {
  public settingsHelper: SettingsTestHelper;
  public loansHelper: LoansTestHelper;
  public lendingPoolHelper: LendingPoolTestHelper;

  constructor(public contracts: Contracts) {
    this.settingsHelper = new SettingsTestHelper(contracts);
    this.loansHelper = new LoansTestHelper(contracts);
    this.lendingPoolHelper = new LendingPoolTestHelper(contracts);
  }

  // expose helper functions

  public async getDummyValue(): Promise<string> {
    if (this.dummy) {
      return (await this.dummy.dummyValue()).toString();
    } else throw '';
  }

  public async setDummyValue(newValue: string): Promise<void> {
    if (this.dummy) {
      await this.dummy.setDummyValue(newValue);
    }
  }
}
