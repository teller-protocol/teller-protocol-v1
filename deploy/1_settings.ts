import { DeployFunction } from 'hardhat-deploy/types'

import {
  deploy,
  deployLogic,
  deploySettingsProxy,
} from '../utils/deploy-helpers'
import { getTokens } from '../config/tokens'
import { Network } from '../types/custom/config-types'
import { Settings } from '../types/typechain'

const deployLogicContracts: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, contracts, ethers, network } = hre
  const { deployer } = await getNamedAccounts()

  const tokens = getTokens(<Network>network.name)

  const { address: loanLibAddress } = await deploy({
    hre,
    contract: 'LoanLib',
  })

  const logicDeploymentData = [
    {
      contract: 'Settings',
    },
    {
      contract: 'ChainlinkAggregator',
    },
    {
      contract: 'TToken',
    },
    {
      contract: 'EtherCollateralLoans',
      libraries: {
        LoanLib: loanLibAddress,
      },
    },
    {
      contract: 'TokenCollateralLoans',
      libraries: {
        LoanLib: loanLibAddress,
      },
    },
    {
      contract: 'LendingPool',
    },
    {
      contract: 'LoanTermsConsensus',
    },
    {
      contract: 'EscrowFactory',
    },
    {
      contract: 'MarketFactory',
    },
    {
      contract: 'Uniswap',
    },
    {
      contract: 'Compound',
    },
    {
      contract: 'AssetSettings',
    },
  ]

  const initialLogicVersions: { logic: string; logicName: string }[] = []
  for (const logicData of logicDeploymentData) {
    const { address: logic } = await deployLogic({
      hre,
      ...logicData,
    })
    initialLogicVersions.push({
      logic,
      logicName: ethers.utils.id(logicData.contract),
    })
  }

  await deploySettingsProxy({
    hre,
    initialLogicVersions,
  })

  const settings = await contracts.get<Settings>('Settings', { from: deployer })
  const ln = await settings.logicName()
  await settings['initialize(address,address)'](tokens.WETH, tokens.CETH)

  const logicVersionsRegistryProxyAddress = await settings.logicRegistry()
  const logicVersionsRegistryLogic = await deployments.getExtendedArtifact(
    'LogicVersionsRegistry'
  )
  await deployments.save('LogicVersionsRegistry', {
    address: logicVersionsRegistryProxyAddress,
    abi: logicVersionsRegistryLogic.abi,
  })

  const chainlinkAggregatorProxyAddress = await settings.chainlinkAggregator()
  const chainlinkAggregatorLogic = await deployments.get(
    'ChainlinkAggregator_Logic'
  )
  await deployments.save('ChainlinkAggregator', {
    address: chainlinkAggregatorProxyAddress,
    abi: chainlinkAggregatorLogic.abi,
  })

  const assetSettingsProxyAddress = await settings.assetSettings()
  const assetSettingsLogic = await deployments.get('AssetSettings_Logic')
  await deployments.save('AssetSettings', {
    address: assetSettingsProxyAddress,
    abi: assetSettingsLogic.abi,
  })

  const escrowFactoryProxyAddress = await settings.escrowFactory()
  const escrowFactoryLogic = await deployments.get('EscrowFactory_Logic')
  await deployments.save('EscrowFactory', {
    address: escrowFactoryProxyAddress,
    abi: escrowFactoryLogic.abi,
  })

  const marketFactoryProxyAddress = await settings.marketFactory()
  const marketFactoryLogic = await deployments.get('MarketFactory_Logic')
  await deployments.save('MarketFactory', {
    address: marketFactoryProxyAddress,
    abi: marketFactoryLogic.abi,
  })
}

deployLogicContracts.tags = ['settings']

export default deployLogicContracts
