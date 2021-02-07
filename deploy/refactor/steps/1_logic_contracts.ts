import { helper } from '../helper';

export async function deployLogicContracts(): Promise<void> {
  const logicContracts = [
    {
      identifier: 'ETH_DAI_Loans_Logic',
      contractName: 'LoansBase',
      libraries: {
        LoanLib: helper.deployments.LoanLib.address,
      },
    },
    {
      identifier: 'ChainlinkAggregator_Logic',
      contractName: 'ChainlinkAggregator',
    },
    {
      identifier: 'ETH_DAI_LendingPool_Logic',
      contractName: 'LendingPool',
    },
    {
      identifier: 'ETH_DAI_LoanTermsConsensus_Logic',
      contractName: 'LoanTermsConsensus',
    },
    {
      identifier: 'EscrowFactory_Logic',
      contractName: 'EscrowFactory',
    },
    {
      identifier: 'MarketFactory_Logic',
      contractName: 'MarketFactory',
    },
    {
      identifier: 'Uniswap_Logic',
      contractName: 'Uniswap',
    },
    {
      identifier: 'Compound_Logic',
      contractName: 'Compound',
    },
    {
      identifier: 'Settings_Logic',
      contractName: 'Settings',
    },
    {
      identifier: 'LogicVersionsRegistry_Logic',
      contractName: 'LogicVersionsRegistry',
    },
    {
      identifier: 'AssetSettings_Logic',
      contractName: 'AssetSettings',
    },
  ];

  for (const { identifier, contractName, libraries } of logicContracts)
    await helper.deploy(identifier, contractName, [], libraries);
}
