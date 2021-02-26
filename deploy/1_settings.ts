import { DeployFunction } from 'hardhat-deploy/types'

import {
  deploy,
  deployLogic,
  deploySettingsProxy,
} from '../utils/deploy-helpers'
import { getTokens } from '../config/tokens'
import { Network } from '../types/custom/config-types'
import { MarketFactory, Settings } from '../types/typechain'

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
  await settings['initialize(address,address)'](tokens.WETH, tokens.CETH)

  await deployments.save('LogicVersionsRegistry', {
    ...(await deployments.getExtendedArtifact('LogicVersionsRegistry')),
    address: await settings.logicRegistry(),
  })

  await deployments.save('ChainlinkAggregator', {
    ...(await deployments.getExtendedArtifact('ChainlinkAggregator')),
    address: await settings.chainlinkAggregator(),
  })

  await deployments.save('AssetSettings', {
    ...(await deployments.getExtendedArtifact('AssetSettings')),
    address: await settings.assetSettings(),
  })

  await deployments.save('EscrowFactory', {
    ...(await deployments.getExtendedArtifact('EscrowFactory')),
    address: await settings.escrowFactory(),
  })

  await deployments.save('MarketFactory', {
    ...(await deployments.getExtendedArtifact('MarketFactory')),
    address: await settings.marketFactory(),
  })
  const marketFactory = await contracts.get<MarketFactory>('MarketFactory')

  await deployments.save('MarketRegistry', {
    ...(await deployments.getExtendedArtifact('MarketRegistry')),
    address: await marketFactory.marketRegistry(),
  })
}

deployLogicContracts.tags = ['settings']

export default deployLogicContracts
