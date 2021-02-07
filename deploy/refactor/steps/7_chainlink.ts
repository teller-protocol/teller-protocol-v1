import { ChainlinkAggregator, Settings } from '../../../typechain';
import { helper } from '../helper';

export async function addChainlinkPairs(): Promise<void> {
  const settingsProxyAddress = helper.deployments.Settings_Proxy.address;
  const settingsInstance = await helper.make<Settings>('Settings', settingsProxyAddress);
  const chainlinkAddress = await settingsInstance.chainlinkAggregator();
  const chainlinkInstance = await helper.make<ChainlinkAggregator>('ChainlinkAggregator', chainlinkAddress);

  const tokens = helper.tokens;

  for (const [pair, { address, baseTokenName, quoteTokenName }] of Object.entries(helper.chainlink)) {
    await helper.call('ChainlinkAggregator_Logic', `add_${pair}`, async () => {
      await chainlinkInstance.add(tokens[baseTokenName], tokens[quoteTokenName], address);
    });
  }
}
