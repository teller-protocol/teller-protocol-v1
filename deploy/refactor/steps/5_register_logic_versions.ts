import { formatBytes32String } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { LogicVersionsRegistry, Settings } from '../../../typechain';
import { helper } from '../helper';

export async function registerLogicVersions(): Promise<void> {
  const logicNames = [
    { identifier: 'ChainlinkAggregator_Logic', logicName: 'ChainlinkAggregator' },
    { identifier: 'ETH_DAI_Loans_Logic', logicName: 'EtherCollateralLoans' },
    { identifier: 'ETH_DAI_LendingPool_Logic', logicName: 'LendingPool' },
    { identifier: 'ETH_DAI_LoanTermsConsensus_Logic', logicName: 'LoanTermsConsensus' },
    { identifier: 'EscrowFactory_Logic', logicName: 'EscrowFactory' },
    { identifier: 'MarketFactory_Logic', logicName: 'MarketFactory' },
    { identifier: 'Uniswap_Logic', logicName: 'Uniswap' },
    { identifier: 'Compound_Logic', logicName: 'Compound' },
    { identifier: 'AssetSettings_Logic', logicName: 'AssetSettings' },
  ];

  const settingsProxyAddress = helper.deployments.Settings_Proxy.address;
  const settingsInstance = await helper.make<Settings>('Settings', settingsProxyAddress);
  const logicVersionsRegistryAddress = await settingsInstance.versionsRegistry();
  const logicVersionsRegistryInstance = await helper.make<LogicVersionsRegistry>(
    'LogicVersionsRegistry',
    logicVersionsRegistryAddress
  );

  const logicVersionsRegistryRequest = logicNames.map(({ logicName, identifier }) => ({
    logic: helper.deployments[identifier].address,
    logicName: ethers.utils.solidityKeccak256(['bytes32'], [formatBytes32String(logicName)]),
  }));

  await helper.call('LogicVersionsRegistry_Logic', 'createLogicVersions', async () => {
    await logicVersionsRegistryInstance.createLogicVersions(logicVersionsRegistryRequest);
  });

  await helper.call('Settings_Proxy', 'postLogicVersionsRegistered', async () => {
    await settingsInstance.postLogicVersionsRegistered();
  });
}
