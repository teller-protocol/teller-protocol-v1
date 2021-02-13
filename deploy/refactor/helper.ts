import { BigNumber, Contract } from 'ethers';
import { readFileSync, writeFileSync } from 'fs';
import { ethers, network } from 'hardhat';
import { join } from 'path';
import { tokens } from '../../config/tokens';
import { PlatformSetting, platformSettings } from '../../config/platform-settings';
import { chainlink, ChainlinkPair } from '../../config/chainlink';
import { AssetSetting, assetSettings } from '../../config/asset-settings';
import { markets } from '../../config/markets';

type Deployments = Record<
  string,
  {
    address: string;
    calls: Record<string, boolean>;
  }
>;

class Helper {
  public deployments: Deployments = {};
  public tokens: Record<string, string> = {};
  public platformSettings: Record<string, PlatformSetting>;
  public chainlink: Record<string, ChainlinkPair>;
  public assetSettings: Record<string, AssetSetting>;
  public markets: { collateralToken: string; borrowedToken: string }[];
  public deployerIndex: number = 0;
  private deploymentPath: string = '';

  constructor(public network: string, public id?: string) {
    if (id) this.deploymentPath = join(__dirname, `../deployments/${this.network}/${this.id}.json`);
    if (['localhost', 'hardhat'].includes(network)) {
      this.deployerIndex = 1;
      network = 'mainnet';
    }
    this.tokens = tokens(network);
    this.platformSettings = platformSettings(network);
    this.chainlink = chainlink(network);
    this.assetSettings = assetSettings(network);
    this.markets = markets(network);
  }

  public async load() {
    if (!this.id) throw 'No deployment ID to loan contracts from';
    this.deployments = JSON.parse(readFileSync(this.deploymentPath).toString());
  }

  public async deploy(identifier: string, contractName: string, args?: any[], libraries?: Record<string, string>): Promise<void> {
    const deployer = (await ethers.getSigners())[this.deployerIndex];
    if (this.deployments[identifier]) {
      console.log(`Not repeating deployment of ${identifier} (${this.deployments[identifier].address})`);
      return;
    }
    const factory = await ethers.getContractFactory(contractName, { libraries });
    const contract = await factory.connect(deployer).deploy(...(args ?? [{ gasLimit: 999999999999, gasPrice: 1 }]));
    await ethers.provider.send('evm_mine', []);

    this.deployments[identifier] = {
      address: contract.address,
      calls: {},
    };
    if (this.id) await this.save();
    console.log(`Deployed ${identifier}/${contractName} - ${contract.address}`);
  }

  public async call(identifier: string, step: string, executor: () => Promise<any>) {
    if (this.deployments[identifier].calls[step]) {
      console.log(`Not repeating call ${step} on ${identifier}`);
      return;
    }
    await executor();
    this.deployments[identifier].calls[step] = true;
    if (this.id) await this.save();
  }

  private async save(): Promise<void> {
    writeFileSync(this.deploymentPath, JSON.stringify(this.deployments, null, 2));
  }

  public async make<C extends Contract>(contractName: string, address: string): Promise<C> {
    const factory = await ethers.getContractFactory(contractName);
    const contract = factory.attach(address) as C;
    return contract;
  }
}

export const helper = new Helper(network.name, process.env.DEPLOYMENT_ID);
