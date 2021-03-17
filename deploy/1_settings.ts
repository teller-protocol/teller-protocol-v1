import { DeployFunction } from 'hardhat-deploy/types'

import {
  deploy,
  DeployArgs,
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

  const mock = network.name.includes('hardhat')
  const logicDeploymentData: Omit<DeployArgs, 'hre'>[] = [
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
      mock,
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
      contract: 'DappRegistry',
    },
    {
      contract: 'MarketFactory',
    },
    {
      contract: 'Escrow',
    },
    {
      contract: 'Uniswap',
    },
    {
      contract: 'Compound',
    },
    {
      contract: 'Aave',
    },
    {
      contract: 'Yearn',
    },
    {
      contract: 'PoolTogether',
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

  await deployments.save('DappRegistry', {
    ...(await deployments.getExtendedArtifact('DappRegistry')),
    address: await settings.dappRegistry(),
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
