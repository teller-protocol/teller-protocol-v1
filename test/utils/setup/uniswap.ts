import {
  ERC20Instance,
  SettingsInstance,
  UniswapMockInstance,
  WETHMockInstance,
  MockInstance,
} from '../../../types/truffle-contracts';
import { DeployConfig } from './types';
import { deploySettings } from './settings';

const Uniswap = artifacts.require('UniswapMock');
const WETH = artifacts.require('WETHMock');
const Mock = artifacts.require('Mock');
const ChainlinkAggregator = artifacts.require('ChainlinkAggregator');

interface UniswapConfig extends DeployConfig {
  settings?: {
    instance: SettingsInstance;
    chainlinkAggregator: MockInstance;
  };
  weth?: WETHMockInstance;
}

export interface DeployUniswapResponse {
  uniswap: UniswapMockInstance;
  settings: SettingsInstance;
  weth: WETHMockInstance;
  mockTokenSupport(token: ERC20Instance): Promise<void>;
  resetTokenSupport(): Promise<void>;
}

export async function deployUniswap(
  config: UniswapConfig
): Promise<DeployUniswapResponse> {
  let settings: SettingsInstance;
  let chainlinkAggregator: MockInstance;
  if (config.settings) {
    settings = config.settings.instance;
    chainlinkAggregator = config.settings.chainlinkAggregator;
  } else {
    const response = await deploySettings(config);
    settings = response.settings;
    chainlinkAggregator = await Mock.at(response.chainlinkAggregatorAddress);
  }

  const weth = config.weth ?? (await WETH.new());
  const uniswap = await Uniswap.new(weth.address);
  await uniswap.setSettings(settings.address);

  const response: DeployUniswapResponse = {
    uniswap,
    settings,
    weth,
    async mockTokenSupport(token: ERC20Instance): Promise<void> {
      const ca = await ChainlinkAggregator.at(chainlinkAggregator.address);
      await chainlinkAggregator.givenCalldataReturnBool(
        ca.contract.methods.isTokenSupported(token.address).encodeABI(),
        true
      );
    },
    async resetTokenSupport(): Promise<void> {
      await chainlinkAggregator.reset();
    },
  };

  await response.mockTokenSupport(weth);

  return response;
}
